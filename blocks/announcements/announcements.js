let announcements = [];
function hasTemplateLink(button) {
  return button.textContent.includes('templateLink');
}
function extractLinkFromTemplate(templateLink, data) {
  const valueMap = {
    '{experienceLink}': data.experienceLink ?? '',
    '{programId}': data.programId ?? '',
  };
  const matchingRuleKeys = Object.keys(valueMap).join('|');
  const matchingRule = new RegExp(`(?:${matchingRuleKeys})`, 'g');

  const matches = [...templateLink.matchAll(matchingRule)];
  // Check for matches relying on a dependency which isn't available (undefined, empty string etc.)
  if (matches.length === 0) {
    return '';
  }

  return templateLink.replace(matchingRule, (matched) => valueMap[matched]);
}

function extractButtonUrl(button) {
  if (button.classList.contains('button-container')) {
    return button.children[0].href;
  }

  if (hasTemplateLink(button)) {
    return button.textContent.match(/templateLink:(.*)/)[1].trim().replace(')', '');
  }

  return '';
}

function extractTitleFromButtonWithTemplate(button) {
  return button.textContent.match(/(.*)templateLink/)[1].replace('(', '').trim();
}

function extractButtonTitle(button) {
  if (button.classList.contains('button-container')) {
    return button.children[0].textContent;
  }

  if (hasTemplateLink(button)) {
    return extractTitleFromButtonWithTemplate(button);
  }

  return button.textContent;
}

function extractAnnouncements(block) {
  const blockAnnouncements = [...block.children];
  const identifiedAnnouncements = blockAnnouncements.map((announcementRow) => {
    const id = announcementRow.querySelector(':scope > div:first-of-type');
    const image = announcementRow.querySelector(':scope > div:nth-of-type(2) > picture');
    const title = announcementRow.querySelector(':scope > div:nth-of-type(3) > h3');
    const description = announcementRow.querySelectorAll(':scope > div:nth-of-type(3) > :not(h3)');
    const primaryButton = announcementRow.querySelector(':scope > div:last-of-type > p:first-of-type');
    const secondaryButton = announcementRow.querySelector(':scope > div:last-of-type > p:nth-of-type(2)');

    return {
      id: parseInt(id?.textContent, 10) ?? '',
      image: image?.innerHTML ?? '',
      title: title?.textContent ?? '',
      description: description ?? '',
      primaryButton: primaryButton ? {
        title: extractButtonTitle(primaryButton),
        url: extractButtonUrl(primaryButton),
      } : null,
      secondaryButton: secondaryButton ? {
        title: extractButtonTitle(secondaryButton),
        url: extractButtonUrl(secondaryButton),
      } : null,
    };
  });
  return identifiedAnnouncements;
}

function filterActiveAnnouncements(config, data) {
  return announcements.filter((announcement) => {
    const announcementConfig = config.find((cfg) => parseInt(cfg.ID, 10) === announcement.id);
    if (announcementConfig && announcementConfig.Active !== 'on') {
      return false;
    }

    if (announcementConfig && announcementConfig['Display condition']) {
      const displayCondition = announcementConfig['Display condition'];
      console.log('Display condition', displayCondition);
      const condition = data[displayCondition];
      console.log('Condition', condition);
    }

    return announcement;
  });
}

function buildAnnouncements(block, data, config) {
  block.innerHTML = '';
  const filteredAnnouncements = filterActiveAnnouncements(config, data);
  // Convert each row into an announcement
  filteredAnnouncements.forEach((row) => {
    // Get the content div (should be the first and only child)
    const announcementContentWrapper = document.createElement('div');
    const announcementImage = document.createElement('div');
    announcementImage.innerHTML = row.image;
    announcementContentWrapper.appendChild(announcementImage);
    const announcementContent = document.createElement('div');
    const title = document.createElement('h3');
    title.innerHTML = row.title;
    announcementContent.appendChild(title);
    const descriptionWrapper = document.createElement('div');
    row.description.forEach((item) => {
      const description = document.createElement('p');
      description.innerHTML = item.innerHTML;
      descriptionWrapper.appendChild(description);
    });
    announcementContent.appendChild(descriptionWrapper);

    if (row.primaryButton || row.secondaryButton) {
      const actionButtonWrapper = document.createElement('div');
      actionButtonWrapper.classList.add('action-button-wrapper');
      if (row.primaryButton) {
        const primaryButton = document.createElement('a');
        primaryButton.innerHTML = row.primaryButton.title;
        primaryButton.href = row.primaryButton.url.includes('{') ? extractLinkFromTemplate(row.primaryButton.url, data) : row.primaryButton.url;
        primaryButton.target = '_blank';
        primaryButton.classList.add('primary-button');
        actionButtonWrapper.appendChild(primaryButton);
      }
      if (row.secondaryButton) {
        const secondaryButton = document.createElement('a');
        secondaryButton.innerHTML = row.secondaryButton.title;
        secondaryButton.href = row.secondaryButton.url.includes('{') ? extractLinkFromTemplate(row.secondaryButton.url, data) : row.secondaryButton.url;
        secondaryButton.target = '_blank';
        actionButtonWrapper.appendChild(secondaryButton);
      }
      announcementContent.appendChild(actionButtonWrapper);
    }
    announcementContentWrapper.appendChild(announcementContent);
    announcementContentWrapper.classList.add('announcement-content');

    block.appendChild(announcementContentWrapper);
  });
}

async function fetchAnnouncementsConfig() {
  const response = await fetch('/announcements-config.json');
  const data = await response.json();
  return data;
}

export default function decorate(block) {
  announcements = extractAnnouncements(block);

  block.innerHTML = '';

  window.addEventListener(
    'message',
    (event) => {
      if (
        !event.data.experienceLink) {
        return;
      }

      console.log(event);
      const { data } = event;
      console.log('Data', data);
      fetchAnnouncementsConfig().then((config) => {
        buildAnnouncements(block, data, config.data);
      });
    },
    false,
  );
  // Add a container class for styling
  block.classList.add('announcements-container');
}

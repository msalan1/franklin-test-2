
let announcements = [];
function hasTemplateLink(button) {
    return button.textContent.includes('templateLink');
}
function extractLinkFromTemplate(templateLink, data) {
    
    const valueMap = {
        '{experienceLink}': data.experienceLink,
        '{programId}': data.programId
    };
    const matchingRuleKeys = Object.keys(valueMap).join('|');
    const matchingRule = new RegExp(`(?:${matchingRuleKeys})`, 'g');
  
    const matches = [...templateLink.matchAll(matchingRule)];
    // Check for matches relying on a dependency which isn't available (undefined, empty string etc.)
    if (matches.length > 0 && matches.some(match => !valueMap[match[0]])) {
      return '';
    }
  
    return templateLink.replace(matchingRule, matched => valueMap[matched]);
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
    const announcements = [...block.children];
    const identifiedAnnouncements = announcements.map((announcementRow) => {
        const image = announcementRow.querySelector(':scope > div:first-of-type > picture');
        const title = announcementRow.querySelector(':scope > div:nth-of-type(2) > h3');
        const description = announcementRow.querySelectorAll(':scope > div:nth-of-type(2) > :not(h3)');
        const primaryButton = announcementRow.querySelector(':scope > div:last-of-type > p:first-of-type');
        const secondaryButton = announcementRow.querySelector(':scope > div:last-of-type > p:nth-of-type(2)');

        return {
            image: image?.innerHTML ?? '',
            title: title?.textContent ?? '',
            description: description ?? '',
            primaryButton: primaryButton ? {
                title: extractButtonTitle(primaryButton),
                url: extractButtonUrl(primaryButton)
            } : null,
            secondaryButton: secondaryButton ? {
                title: extractButtonTitle(secondaryButton),
                url: extractButtonUrl(secondaryButton)
            } : null
        }
    });
    return identifiedAnnouncements;
}

function buildAnnouncements(block, data) {
  block.innerHTML = '';

  // Convert each row into an announcement
  announcements.forEach((row, index) => {
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
    row.description.forEach(item => {
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

export default function decorate(block) {
    announcements = extractAnnouncements(block);
    window.addEventListener(
        "message",
        (event) => {
            if (!event.data.experienceLink &&
                !event.data.programId &&
                event.origin !== 'https://experience-qa.adobe.com/' &&
                event.origin !== 'https://localhost.corp.adobe.com:8013') {
                return;
            }

            console.log(event);
            const data = event.data;
            console.log('Data', data);

            buildAnnouncements(block, data);
        },
        false
    );
  // Add a container class for styling
  block.classList.add('announcements-container');
} 

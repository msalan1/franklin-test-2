
function hasTemplateLink(button) {
    return button.textContent.includes('templateLink');
}
function extractLinkFromTemplate(button) {
    const experienceDomainLink = 'https://experience-qa.adobe.com';
    const templateLink = button.textContent.match(/templateLink:(.*)/)[1].trim().replace(')', '');
    
    const valueMap = {
        '{experienceLink}': experienceDomainLink
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
        return extractLinkFromTemplate(button);
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
        const title = announcementRow.querySelector('div > div:first-of-type > h3');
        const description = announcementRow.querySelector('div > div:first-of-type > :not(h3)');
        const primaryButton = announcementRow.querySelector('div > div:last-of-type > p:first-of-type');
        const secondaryButton = announcementRow.querySelector('div > div:last-of-type > p:nth-of-type(2)');

        return {
            title: title?.textContent ?? '',
            description: description?.textContent ?? '',
            primaryButton: {
                title: extractButtonTitle(primaryButton),
                url: extractButtonUrl(primaryButton)
            },
            secondaryButton: {
                title: extractButtonTitle(secondaryButton),
                url: extractButtonUrl(secondaryButton)
            }
        }
    });
    return identifiedAnnouncements;
}

export default function decorate(block) {
  // Add a container class for styling
  block.classList.add('announcements-container');

  // Get all announcement rows
  const announcements = extractAnnouncements(block);

  block.innerHTML = '';

  // Convert each row into an announcement
  announcements.forEach((row, index) => {
    // Get the content div (should be the first and only child)
    const content = document.createElement('div');
    const title = document.createElement('h3');
    title.innerHTML = row.title;
    content.appendChild(title);
    const description = document.createElement('div');
    description.innerHTML = row.description;
    content.appendChild(description);
    const actionButtonWrapper = document.createElement('div');
    const primaryButton = document.createElement('a');
    primaryButton.innerHTML = row.primaryButton.title;
    primaryButton.href = row.primaryButton.url;
    primaryButton.target = '_blank';
    actionButtonWrapper.appendChild(primaryButton);
    const secondaryButton = document.createElement('a');
    secondaryButton.innerHTML = row.secondaryButton.title;
    secondaryButton.href = row.secondaryButton.url;
    secondaryButton.target = '_blank';
    actionButtonWrapper.appendChild(secondaryButton);
    content.appendChild(actionButtonWrapper);
    content.classList.add('announcement-content');
    

      block.appendChild(content);
  });
} 

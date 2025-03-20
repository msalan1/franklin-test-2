
function hasTemplateLink(button) {
    return button.textContent.includes('templateLink');
}
function extractLinkFromTemplate(button) {
    const experienceDomainLink = 'https://experience-qa.adobe.com';
    const templateLink = button.textContent.match(/templateLink=(.*)/)[1];
    const valueMap = {
        '{experienceLink}': experienceDomainLink
    };
    const matchingRuleKeys = Object.keys(valueMap).join('|');
    const matchingRule = new RegExp(`(?:${matchingRuleKeys})`, 'g');
  
    const matches = [...template.matchAll(matchingRule)];
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
    return button.textContent.match(/templateLink=(.*)/)[0].trim();
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
        const title = announcementRow.querySelector('div:first-of-type > h3');
        const description = announcementRow.querySelector('div:first-of-type > :not(h3)');
        const primaryButton = announcementRow.querySelector('div:last-of-type > :first-of-type');
        const secondaryButton = announcementRow.querySelector('div:last-of-type > :nth-of-type(2)');

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

  // Convert each row into an announcement
  announcements.forEach((row, index) => {
    row.classList.add('announcement');
    
    // Add announcement number for styling/targeting
    row.dataset.announcementIndex = index;

    // Get the content div (should be the first and only child)
    const content = document.createElement('div');
    const title = document.createElement('h3');
    title.innerHTML = row.title;
    const description = document.createElement('div');
    description.innerHTML = row.description;
    const primaryButton = document.createElement('a');
    primaryButton.innerHTML = row.primaryButton.title;
    primaryButton.href = row.primaryButton.url;
    const secondaryButton = document.createElement('a');
    secondaryButton.innerHTML = row.secondaryButton.title;
    secondaryButton.href = row.secondaryButton.url;

    content.classList.add('announcement-content');
    
    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.classList.add('announcement-close');
    closeButton.setAttribute('aria-label', 'Close announcement');
    closeButton.innerHTML = '×';
    
    closeButton.addEventListener('click', () => {
    row.classList.add('announcement-hidden');
    // Optional: Store in localStorage that this announcement was closed
    localStorage.setItem(`announcement-${index}-closed`, 'true');
    });
    
    content.appendChild(closeButton);
    
    // Check if this announcement was previously closed
    if (localStorage.getItem(`announcement-${index}-closed`) === 'true') {
      row.classList.add('announcement-hidden');
    }
  });
} 

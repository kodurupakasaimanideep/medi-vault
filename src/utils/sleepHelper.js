/**
 * Resolve ideal sleep range and guidelines based on the user's age
 * (According to NIH sleep guidelines in the provided reference image)
 */
export function getIdealSleepRange(age) {
  const ageNum = parseInt(age, 10);
  if (isNaN(ageNum) || ageNum < 0) {
    // Default fallback to Adult
    return { label: 'Adults (18-64 years)', min: 7, max: 9, avg: 8 };
  }

  if (ageNum < 1) { // Under 1 year (0-12 months)
    return { label: 'Infants (0-12 months)', min: 12, max: 17, avg: 14.5 };
  } else if (ageNum <= 5) { // 1-5 years
    return { label: 'Toddlers/Preschoolers (1-5 years)', min: 10, max: 14, avg: 12 };
  } else if (ageNum <= 13) { // 6-13 years
    return { label: 'School-Age Children (6-13 years)', min: 9, max: 12, avg: 10.5 };
  } else if (ageNum <= 17) { // 14-17 years
    return { label: 'Teenagers (14-17 years)', min: 8, max: 10, avg: 9 };
  } else if (ageNum <= 64) { // 18-64 years
    return { label: 'Adults (18-64 years)', min: 7, max: 9, avg: 8 };
  } else { // 65+ years
    return { label: 'Older Adults (65+)', min: 7, max: 8, avg: 7.5 };
  }
}

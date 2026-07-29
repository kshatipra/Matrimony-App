import type { Profile } from './profile';
import { calculateAge } from './browse';

async function toBase64DataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function row(label: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  return `<tr><td class="label">${label}</td><td class="value">${value}</td></tr>`;
}

function section(title: string, rows: string[]): string {
  const filledRows = rows.filter(Boolean);
  if (filledRows.length === 0) return '';
  return `<div class="section-title">${title}</div><table>${filledRows.join('')}</table>`;
}

export async function buildBiodataHtml(profile: Profile, photoUrl: string | null): Promise<string> {
  const photoDataUri = photoUrl ? await toBase64DataUri(photoUrl) : null;
  const age = calculateAge(profile.dob);

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Georgia, 'Times New Roman', serif; color: #1f2937; padding: 32px; }
          .header { text-align: center; margin-bottom: 24px; }
          .header h1 { color: #be123c; margin: 0 0 4px; font-size: 28px; }
          .header p { margin: 0; color: #6b7280; }
          .photo { display: block; margin: 0 auto 24px; width: 160px; height: 160px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; }
          .section-title { color: #be123c; font-size: 16px; font-weight: bold; margin: 20px 0 8px; border-bottom: 2px solid #fecdd3; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 6px 4px; font-size: 13px; vertical-align: top; }
          td.label { width: 40%; color: #6b7280; }
          td.value { font-weight: 600; }
          .about { font-size: 13px; line-height: 1.5; color: #374151; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${profile.full_name}</h1>
          <p>${age} years · ${[profile.city, profile.state].filter(Boolean).join(', ')}</p>
        </div>

        ${photoDataUri ? `<img class="photo" src="${photoDataUri}" />` : ''}

        ${profile.about_me ? `<div class="section-title">About</div><p class="about">${profile.about_me}</p>` : ''}

        ${section('Personal Details', [
          row('Date of birth', profile.dob),
          row('Height', profile.height_cm ? `${profile.height_cm} cm` : null),
          row('Marital status', profile.marital_status),
          row('Diet', profile.diet),
          row('Religion', profile.religion),
          row('Caste', profile.caste),
          row('Sub-caste', profile.sub_caste),
          row('Gothra', profile.gothra),
          row('Mother tongue', profile.mother_tongue),
          row('Languages known', profile.languages_known),
        ])}

        ${section('Education & Career', [
          row('Education', profile.education),
          row('Occupation', profile.occupation),
          row('Annual income', profile.annual_income_inr ? `₹${profile.annual_income_inr.toLocaleString('en-IN')}` : null),
        ])}

        ${section('Family Details', [
          row("Father's occupation", profile.father_occupation),
          row("Mother's occupation", profile.mother_occupation),
          row('Siblings', profile.siblings),
        ])}

        ${section('Horoscope', [
          row('Manglik status', profile.manglik_status),
          row('Birth time', profile.birth_time),
          row('Birth place', profile.birth_place),
          row('Nakshatra', profile.nakshatra),
          row('Rashi', profile.rashi),
        ])}
      </body>
    </html>
  `;
}

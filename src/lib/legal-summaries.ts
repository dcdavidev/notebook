import type { LegalPageName } from '@/components/legal-page';
import type { Locale } from '@/lib/locale';

/**
One point of a summary: a short heading and one or two sentences.
*/
export interface SummaryPoint {
  title: string;
  text: string;
}

export interface LegalSummary {
  title: string;
  intro: string;
  points: SummaryPoint[];
}

/**
Short summaries of the legal pages in `docs/legal`. Keep them in sync with the
full documents: they only repeat what the documents say.
*/
export const legalSummaries: Record<
  LegalPageName,
  Record<Locale, LegalSummary>
> = {
  privacy: {
    en: {
      title: 'Privacy Policy',
      intro:
        'Notebook is a free, non-commercial site. You can read every course without an account, and there is no advertising.',
      points: [
        {
          title: 'Server logs',
          text: 'Vercel, the hosting provider, records technical data such as your IP address and browser, to deliver the pages and keep the site secure.',
        },
        {
          title: 'Preferences',
          text: 'Your language, theme, palette, and cookie choice stay on your device. If you sign in, they are also saved in your account.',
        },
        {
          title: 'Account, only if you sign in',
          text: 'With Google, GitHub, or Facebook, Notebook receives your name, email address, and profile picture. You can download your data or delete your account at any time.',
        },
        {
          title: 'Statistics, only with your consent',
          text: 'Vercel Web Analytics counts page views anonymously and without cookies. You can withdraw consent from Settings → Cookie preferences.',
        },
        {
          title: 'Your rights',
          text: 'Under the GDPR, you can access, correct, delete, or move your data, and lodge a complaint with a supervisory authority. Your data is never sold.',
        },
      ],
    },
    it: {
      title: 'Informativa sulla privacy',
      intro:
        'Notebook è un sito gratuito e non commerciale. Puoi leggere tutti i corsi senza account e non c’è pubblicità.',
      points: [
        {
          title: 'Log del server',
          text: 'Vercel, il fornitore di hosting, registra dati tecnici come il tuo indirizzo IP e il browser, per consegnare le pagine e proteggere il sito.',
        },
        {
          title: 'Preferenze',
          text: 'Lingua, tema, palette e scelta sui cookie restano sul tuo dispositivo. Se accedi, vengono salvati anche nel tuo account.',
        },
        {
          title: 'Account, solo se accedi',
          text: 'Con Google, GitHub o Facebook, Notebook riceve nome, indirizzo email e immagine del profilo. Puoi scaricare i tuoi dati o eliminare l’account in qualsiasi momento.',
        },
        {
          title: 'Statistiche, solo con il tuo consenso',
          text: 'Vercel Web Analytics conta le visite in forma anonima e senza cookie. Puoi revocare il consenso da Impostazioni → Preferenze cookie.',
        },
        {
          title: 'I tuoi diritti',
          text: 'Secondo il GDPR puoi accedere ai tuoi dati, correggerli, cancellarli o portarli altrove, e presentare reclamo al Garante. I dati non vengono mai venduti.',
        },
      ],
    },
  },
  cookies: {
    en: {
      title: 'Cookie Policy',
      intro:
        'Notebook stores only a few first-party cookies and local storage values, and only Notebook can read them.',
      points: [
        {
          title: 'Necessary',
          text: 'They remember your language, theme, palette, cookie choice, and keep you signed in. They are always on.',
        },
        {
          title: 'Analytics',
          text: 'Off until you accept them. Vercel Web Analytics counts page views anonymously and stores nothing in your browser.',
        },
        {
          title: 'External content',
          text: 'Off until you accept it. At the moment, Notebook does not embed any external content.',
        },
        {
          title: 'Change your choice',
          text: 'Open Settings → Cookie preferences, or delete cookies and local storage in your browser settings.',
        },
      ],
    },
    it: {
      title: 'Cookie Policy',
      intro:
        'Notebook salva solo pochi cookie e dati nella memoria del browser, tutti di prima parte: solo Notebook può leggerli.',
      points: [
        {
          title: 'Necessari',
          text: 'Ricordano lingua, tema, palette, la scelta sui cookie e mantengono l’accesso. Sono sempre attivi.',
        },
        {
          title: 'Analitici',
          text: 'Spenti finché non li accetti. Vercel Web Analytics conta le visite in forma anonima e non salva nulla nel browser.',
        },
        {
          title: 'Contenuti esterni',
          text: 'Spenti finché non li accetti. Al momento Notebook non incorpora contenuti esterni.',
        },
        {
          title: 'Cambiare la tua scelta',
          text: 'Apri Impostazioni → Preferenze cookie, oppure cancella cookie e memoria del browser dalle impostazioni del browser.',
        },
      ],
    },
  },
  terms: {
    en: {
      title: 'Terms of Use',
      intro:
        'By using Notebook, a free site with programming courses and study notes, you accept these terms.',
      points: [
        {
          title: 'The service',
          text: 'Notebook is free and needs no account. It may change, pause, or stop at any time.',
        },
        {
          title: 'License',
          text: 'The code and the courses are released under the GNU AGPL v3.0. Contributions are released under the same license.',
        },
        {
          title: 'No warranty',
          text: 'The content is provided “as is” and can contain mistakes. Try code examples on a test system, never directly in production.',
        },
        {
          title: 'Trademarks',
          text: 'SAP and the other names belong to their owners. Notebook isn’t affiliated with or endorsed by them.',
        },
        {
          title: 'Applicable law',
          text: 'Italian law applies. As a consumer, you keep the protections of your country of residence.',
        },
      ],
    },
    it: {
      title: 'Termini e condizioni di utilizzo',
      intro:
        'Usando Notebook, un sito gratuito con corsi di programmazione e appunti di studio, accetti questi termini.',
      points: [
        {
          title: 'Il servizio',
          text: 'Notebook è gratuito e non richiede un account. Può cambiare, fermarsi o chiudere in qualsiasi momento.',
        },
        {
          title: 'Licenza',
          text: 'Il codice e i corsi sono rilasciati con licenza GNU AGPL v3.0. Anche i contributi sono rilasciati con la stessa licenza.',
        },
        {
          title: 'Nessuna garanzia',
          text: 'I contenuti sono forniti “così come sono” e possono contenere errori. Prova gli esempi di codice su un sistema di test, mai direttamente in produzione.',
        },
        {
          title: 'Marchi',
          text: 'SAP e gli altri nomi appartengono ai rispettivi proprietari. Notebook non è affiliato né approvato da loro.',
        },
        {
          title: 'Legge applicabile',
          text: 'Si applica la legge italiana. Come consumatore, mantieni le tutele del tuo paese di residenza.',
        },
      ],
    },
  },
};

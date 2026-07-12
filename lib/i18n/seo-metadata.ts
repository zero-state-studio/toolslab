import { type Locale } from './config';

/**
 * Centralized SEO metadata for all pages
 * Auto-scales with any number of locales
 */

export interface SEOMetadata {
  keywords: Record<Locale, string[]>;
  descriptions: Record<Locale, string>;
  titles: Record<Locale, string>;
}

/**
 * Page-specific SEO metadata
 */
export const PAGE_METADATA: Record<string, SEOMetadata> = {
  home: {
    titles: {
      en: 'ToolsLab - Free Developer Tools Laboratory',
      it: 'ToolsLab - Laboratorio Strumenti Sviluppatore Gratuiti',
      es: 'ToolsLab - Laboratorio de Herramientas Gratuitas para Desarrolladores',
      fr: "ToolsLab - Laboratoire d'Outils Gratuits pour Développeurs",
      de: 'ToolsLab - Kostenlose Entwickler-Tools Labor',
      pt: 'ToolsLab - Laboratório Gratuito de Ferramentas para Desenvolvedores',
    },
    descriptions: {
      en: 'Free online developer tools for JSON formatting, Base64 encoding, URL decoding, hash generation, and more. All tools work entirely in your browser with no data transmission to servers.',
      it: 'Strumenti online gratuiti per sviluppatori: formattazione JSON, codifica Base64, decodifica URL, generazione hash e altro. Tutti gli strumenti funzionano nel tuo browser senza trasmissione dati.',
      es: 'Herramientas en línea gratuitas para desarrolladores: formateo JSON, codificación Base64, decodificación URL, generación hash y más. Todas las herramientas funcionan en tu navegador sin transmisión de datos.',
      fr: 'Outils en ligne gratuits pour développeurs: formatage JSON, encodage Base64, décodage URL, génération hash et plus. Tous les outils fonctionnent dans votre navigateur sans transmission de données.',
      de: 'Kostenlose Online-Entwickler-Tools für JSON-Formatierung, Base64-Kodierung, URL-Dekodierung, Hash-Generierung und mehr. Alle Tools funktionieren vollständig in Ihrem Browser ohne Datenübertragung zu Servern.',
      pt: 'Ferramentas online gratuitas para desenvolvedores: formatação JSON, codificação Base64, decodificação URL, geração hash e muito mais. Todas as ferramentas funcionam no seu navegador sem transmissão de dados para servidores.',
    },
    keywords: {
      en: [
        'developer tools',
        'json formatter',
        'base64 encoder',
        'jwt decoder',
        'uuid generator',
        'hash generator',
        'url encoder',
        'timestamp converter',
        'regex tester',
        'online tools',
        'web tools',
        'free tools',
        'browser tools',
      ],
      it: [
        'strumenti sviluppatore',
        'formatter json',
        'codificatore base64',
        'decodificatore jwt',
        'generatore uuid',
        'generatore hash',
        'codificatore url',
        'convertitore timestamp',
        'tester regex',
        'strumenti online',
        'strumenti web',
        'strumenti gratuiti',
      ],
      es: [
        'herramientas desarrollador',
        'formateador json',
        'codificador base64',
        'decodificador jwt',
        'generador uuid',
        'generador hash',
        'codificador url',
        'convertidor timestamp',
        'probador regex',
        'herramientas online',
        'herramientas web',
        'herramientas gratuitas',
      ],
      fr: [
        'outils développeur',
        'formateur json',
        'encodeur base64',
        'décodeur jwt',
        'générateur uuid',
        'générateur hash',
        'encodeur url',
        'convertisseur timestamp',
        'testeur regex',
        'outils en ligne',
        'outils web',
        'outils gratuits',
      ],
      de: [
        'entwickler tools',
        'json formatierer',
        'base64 encoder',
        'jwt decoder',
        'uuid generator',
        'hash generator',
        'url encoder',
        'timestamp konverter',
        'regex tester',
        'online tools',
        'web tools',
        'kostenlose tools',
      ],
      pt: [
        'ferramentas desenvolvedor',
        'formatador json',
        'codificador base64',
        'decodificador jwt',
        'gerador uuid',
        'gerador hash',
        'codificador url',
        'conversor timestamp',
        'testador regex',
        'ferramentas online',
        'ferramentas web',
        'ferramentas gratuitas',
      ],
    },
  },
  tools: {
    // "| ToolsLab" is appended by the layout title template — do NOT add it here.
    titles: {
      en: 'All Developer Tools - Free Online Utilities',
      it: 'Tutti gli Strumenti Sviluppatore - Tools Online Gratuiti',
      es: 'Todas las Herramientas para Desarrolladores - Utilidades Online Gratuitas',
      fr: 'Tous les Outils pour Développeurs - Utilitaires en Ligne Gratuits',
      de: 'Alle Entwickler-Tools - Kostenlose Online-Utilities',
      pt: 'Todas as Ferramentas para Desenvolvedores - Utilitários Online Gratuitos',
    },
    descriptions: {
      en: 'Discover 20+ free online tools for JSON formatting, Base64 encoding, URL decoding, hash generation, and more. All tools work entirely in your browser with no data transmission to servers. Perfect for development, debugging, and data processing workflows.',
      it: 'Scopri 20+ strumenti online gratuiti per formattazione JSON, codifica Base64, decodifica URL, generazione hash e altro. Tutti gli strumenti funzionano interamente nel tuo browser senza trasmissione dati ai server. Perfetti per flussi di lavoro di sviluppo, debug e elaborazione dati.',
      es: 'Descubre 20+ herramientas en línea gratuitas para formateo JSON, codificación Base64, decodificación URL, generación hash y más. Todas las herramientas funcionan completamente en tu navegador sin transmisión de datos a servidores. Perfectas para flujos de trabajo de desarrollo, depuración y procesamiento de datos.',
      fr: "Découvrez 20+ outils en ligne gratuits pour le formatage JSON, l'encodage Base64, le décodage URL, la génération hash et plus. Tous les outils fonctionnent entièrement dans votre navigateur sans transmission de données aux serveurs. Parfaits pour les flux de travail de développement, débogage et traitement de données.",
      de: 'Entdecken Sie 20+ kostenlose Online-Tools für JSON-Formatierung, Base64-Kodierung, URL-Dekodierung, Hash-Generierung und mehr. Alle Tools funktionieren vollständig in Ihrem Browser ohne Datenübertragung zu Servern. Perfekt für Entwicklungs-, Debugging- und Datenverarbeitungs-Workflows.',
      pt: 'Descubra 20+ ferramentas online gratuitas para formatação JSON, codificação Base64, decodificação URL, geração hash e muito mais. Todas as ferramentas funcionam completamente no seu navegador sem transmissão de dados para servidores. Perfeitas para fluxos de trabalho de desenvolvimento, depuração e processamento de dados.',
    },
    keywords: {
      en: [
        'developer tools online',
        'free developer utilities',
        'web development tools',
        'json formatter',
        'base64 encoder',
        'url decoder',
        'hash generator',
        'browser-based tools',
        'development utilities',
        'programming tools',
        'web utilities',
        'free online tools',
      ],
      it: [
        'strumenti sviluppatore online',
        'utilità sviluppatore gratuite',
        'strumenti sviluppo web',
        'json formatter',
        'codificatore base64',
        'decodificatore url',
        'generatore hash',
        'strumenti basati su browser',
        'utilità sviluppo',
        'strumenti programmazione',
        'utilità web',
        'strumenti online gratuiti',
      ],
      es: [
        'herramientas desarrollador online',
        'utilidades desarrollador gratuitas',
        'herramientas desarrollo web',
        'formateador json',
        'codificador base64',
        'decodificador url',
        'generador hash',
        'herramientas basadas en navegador',
        'utilidades desarrollo',
        'herramientas programación',
        'utilidades web',
        'herramientas online gratuitas',
      ],
      fr: [
        'outils développeur en ligne',
        'utilitaires développeur gratuits',
        'outils développement web',
        'formateur json',
        'encodeur base64',
        'décodeur url',
        'générateur hash',
        'outils basés sur navigateur',
        'utilitaires développement',
        'outils programmation',
        'utilitaires web',
        'outils en ligne gratuits',
      ],
      de: [
        'entwickler tools online',
        'kostenlose entwickler utilities',
        'web development tools',
        'json formatierer',
        'base64 encoder',
        'url decoder',
        'hash generator',
        'browser-basierte tools',
        'development utilities',
        'programming tools',
        'web utilities',
        'kostenlose online tools',
      ],
      pt: [
        'ferramentas desenvolvedor online',
        'utilitários desenvolvedor gratuitos',
        'ferramentas desenvolvimento web',
        'formatador json',
        'codificador base64',
        'decodificador url',
        'gerador hash',
        'ferramentas baseadas em navegador',
        'utilitários desenvolvimento',
        'ferramentas programação',
        'utilitários web',
        'ferramentas online gratuitas',
      ],
    },
  },
  categories: {
    // "| ToolsLab" is appended by the layout title template — do NOT add it here.
    titles: {
      en: 'Tool Categories - Browse by Type',
      it: 'Categorie Strumenti - Sfoglia per Tipo',
      es: 'Categorías de Herramientas - Navegar por Tipo',
      fr: "Catégories d'Outils - Parcourir par Type",
      de: 'Tool-Kategorien - Nach Typ durchsuchen',
      pt: 'Categorias de Ferramentas - Navegar por Tipo',
    },
    descriptions: {
      en: 'Browse developer tools organized by category: Data & Conversion, Encoding & Security, Text & Format, Generators, Web & Design, and Development Utilities.',
      it: 'Sfoglia gli strumenti per sviluppatori organizzati per categoria: Data & Conversione, Codifica & Sicurezza, Testo & Formato, Generatori, Web & Design, e Utilità di Sviluppo.',
      es: 'Explora herramientas para desarrolladores organizadas por categoría: Datos & Conversión, Codificación & Seguridad, Texto & Formato, Generadores, Web & Diseño, y Utilidades de Desarrollo.',
      fr: 'Parcourez les outils pour développeurs organisés par catégorie: Données & Conversion, Encodage & Sécurité, Texte & Format, Générateurs, Web & Design, et Utilitaires de Développement.',
      de: 'Durchsuchen Sie Entwickler-Tools organisiert nach Kategorie: Daten & Konvertierung, Kodierung & Sicherheit, Text & Format, Generatoren, Web & Design und Entwicklungs-Utilities.',
      pt: 'Navegue pelas ferramentas para desenvolvedores organizadas por categoria: Dados & Conversão, Codificação & Segurança, Texto & Formato, Geradores, Web & Design e Utilitários de Desenvolvimento.',
    },
    keywords: {
      en: [
        'tool categories',
        'developer tools by type',
        'data conversion tools',
        'encoding tools',
        'text formatting tools',
        'code generators',
        'web development tools',
        'utility categories',
      ],
      it: [
        'categorie strumenti',
        'strumenti sviluppatore per tipo',
        'strumenti conversione dati',
        'strumenti codifica',
        'strumenti formattazione testo',
        'generatori codice',
        'strumenti sviluppo web',
        'categorie utilità',
      ],
      es: [
        'categorías herramientas',
        'herramientas desarrollador por tipo',
        'herramientas conversión datos',
        'herramientas codificación',
        'herramientas formateo texto',
        'generadores código',
        'herramientas desarrollo web',
        'categorías utilidades',
      ],
      fr: [
        'catégories outils',
        'outils développeur par type',
        'outils conversion données',
        'outils encodage',
        'outils formatage texte',
        'générateurs code',
        'outils développement web',
        'catégories utilitaires',
      ],
      de: [
        'tool kategorien',
        'entwickler tools nach typ',
        'datenkonvertierungs tools',
        'kodierungs tools',
        'textformatierungs tools',
        'code generatoren',
        'webentwicklungs tools',
        'utility kategorien',
      ],
      pt: [
        'categorias ferramentas',
        'ferramentas desenvolvedor por tipo',
        'ferramentas conversão dados',
        'ferramentas codificação',
        'ferramentas formatação texto',
        'geradores código',
        'ferramentas desenvolvimento web',
        'categorias utilitários',
      ],
    },
  },
  lab: {
    // "| ToolsLab" is appended by the layout title template — do NOT add it here.
    titles: {
      en: 'My Developer Lab - Favorites & Tool Chain',
      it: 'Il Mio Lab Sviluppatore - Preferiti & Catena Strumenti',
      es: 'Mi Laboratorio de Desarrollo - Favoritos & Cadena de Herramientas',
      fr: "Mon Laboratoire de Développeur - Favoris & Chaîne d'Outils",
      de: 'Mein Entwickler-Labor - Favoriten & Tool-Kette',
      pt: 'Meu Laboratório de Desenvolvimento - Favoritos & Cadeia de Ferramentas',
    },
    descriptions: {
      en: 'Your personal developer lab. Save your favorite tools, create custom tool chains, and streamline your development workflow with quick access to frequently used utilities.',
      it: 'Il tuo laboratorio personale per sviluppatori. Salva i tuoi strumenti preferiti, crea catene di strumenti personalizzate e ottimizza il tuo flusso di lavoro con accesso rapido alle utilità più utilizzate.',
      es: 'Tu laboratorio personal de desarrollo. Guarda tus herramientas favoritas, crea cadenas de herramientas personalizadas y optimiza tu flujo de trabajo con acceso rápido a las utilidades más utilizadas.',
      fr: "Votre laboratoire personnel de développeur. Enregistrez vos outils favoris, créez des chaînes d'outils personnalisées et rationalisez votre flux de travail avec un accès rapide aux utilitaires fréquemment utilisés.",
      de: 'Ihr persönliches Entwickler-Labor. Speichern Sie Ihre bevorzugten Tools, erstellen Sie benutzerdefinierte Tool-Ketten und optimieren Sie Ihren Entwicklungs-Workflow mit schnellem Zugriff auf häufig verwendete Utilities.',
      pt: 'Seu laboratório pessoal de desenvolvimento. Salve suas ferramentas favoritas, crie cadeias de ferramentas personalizadas e otimize seu fluxo de trabalho com acesso rápido aos utilitários mais utilizados.',
    },
    keywords: {
      en: [
        'developer lab',
        'favorite tools',
        'tool chain',
        'development workflow',
        'personal workspace',
        'saved tools',
        'productivity',
        'developer workspace',
      ],
      it: [
        'lab sviluppatore',
        'strumenti preferiti',
        'catena strumenti',
        'flusso lavoro sviluppo',
        'workspace personale',
        'strumenti salvati',
        'produttività',
        'workspace sviluppatore',
      ],
      es: [
        'laboratorio desarrollador',
        'herramientas favoritas',
        'cadena herramientas',
        'flujo trabajo desarrollo',
        'espacio trabajo personal',
        'herramientas guardadas',
        'productividad',
        'espacio trabajo desarrollador',
      ],
      fr: [
        'laboratoire développeur',
        'outils favoris',
        'chaîne outils',
        'flux travail développement',
        'espace travail personnel',
        'outils enregistrés',
        'productivité',
        'espace travail développeur',
      ],
      de: [
        'entwickler labor',
        'favoriten tools',
        'tool kette',
        'entwicklungs workflow',
        'persönlicher arbeitsbereich',
        'gespeicherte tools',
        'produktivität',
        'entwickler arbeitsbereich',
      ],
      pt: [
        'laboratório desenvolvedor',
        'ferramentas favoritas',
        'cadeia ferramentas',
        'fluxo trabalho desenvolvimento',
        'espaço trabalho pessoal',
        'ferramentas salvas',
        'produtividade',
        'espaço trabalho desenvolvedor',
      ],
    },
  },
  about: {
    titles: {
      en: 'About ToolsLab - The Story of Your Developer Toolbox',
      it: 'Chi Siamo - La Storia del Tuo Toolbox per Sviluppatori',
      es: 'Acerca de ToolsLab - La Historia de Tu Caja de Herramientas de Desarrollo',
      fr: "À Propos de ToolsLab - L'Histoire de Votre Boîte à Outils de Développeur",
      de: 'Über ToolsLab - Die Geschichte Ihrer Entwickler-Toolbox',
      pt: 'Sobre o ToolsLab - A História da Sua Caixa de Ferramentas de Desenvolvimento',
    },
    descriptions: {
      en: 'Discover how ToolsLab evolved from a personal project to a trusted toolkit for thousands of developers worldwide. Free forever, no strings attached.',
      it: 'Scopri come ToolsLab si è evoluto da un progetto personale a un toolkit affidabile per migliaia di sviluppatori in tutto il mondo. Gratuito per sempre, senza vincoli.',
      es: 'Descubre cómo ToolsLab evolucionó de un proyecto personal a un conjunto de herramientas confiable para miles de desarrolladores en todo el mundo. Gratis para siempre, sin condiciones.',
      fr: "Découvrez comment ToolsLab a évolué d'un projet personnel à une boîte à outils fiable pour des milliers de développeurs dans le monde entier. Gratuit pour toujours, sans conditions.",
      de: 'Entdecken Sie, wie ToolsLab sich von einem persönlichen Projekt zu einem vertrauenswürdigen Toolkit für Tausende von Entwicklern weltweit entwickelt hat. Für immer kostenlos, ohne Bedingungen.',
      pt: 'Descubra como o ToolsLab evoluiu de um projeto pessoal para um conjunto de ferramentas confiável para milhares de desenvolvedores em todo o mundo. Gratuito para sempre, sem condições.',
    },
    keywords: {
      en: [
        'about toolslab',
        'developer tools story',
        'free developer tools',
        'privacy first tools',
        'independent developer',
        'toolslab mission',
        'developer productivity',
        'swiss army knife for developers',
      ],
      it: [
        'chi siamo toolslab',
        'storia strumenti sviluppatore',
        'strumenti sviluppatore gratuiti',
        'strumenti privacy first',
        'sviluppatore indipendente',
        'missione toolslab',
        'produttività sviluppatore',
        'coltellino svizzero per sviluppatori',
      ],
      es: [
        'acerca toolslab',
        'historia herramientas desarrollador',
        'herramientas desarrollador gratuitas',
        'herramientas privacidad primero',
        'desarrollador independiente',
        'misión toolslab',
        'productividad desarrollador',
        'navaja suiza para desarrolladores',
      ],
      fr: [
        'à propos toolslab',
        'histoire outils développeur',
        'outils développeur gratuits',
        "outils confidentialité d'abord",
        'développeur indépendant',
        'mission toolslab',
        'productivité développeur',
        'couteau suisse pour développeurs',
      ],
      de: [
        'über toolslab',
        'entwickler tools geschichte',
        'kostenlose entwickler tools',
        'datenschutz zuerst tools',
        'unabhängiger entwickler',
        'toolslab mission',
        'entwickler produktivität',
        'schweizer taschenmesser für entwickler',
      ],
      pt: [
        'sobre toolslab',
        'história ferramentas desenvolvedor',
        'ferramentas desenvolvedor gratuitas',
        'ferramentas privacidade primeiro',
        'desenvolvedor independente',
        'missão toolslab',
        'produtividade desenvolvedor',
        'canivete suíço para desenvolvedores',
      ],
    },
  },
} as const;

/**
 * Get SEO metadata for a specific page and locale
 */
export function getPageMetadata(
  page: string,
  locale: Locale
): {
  title: string;
  description: string;
  keywords: string[];
} {
  const metadata = PAGE_METADATA[page];

  if (!metadata) {
    // Fallback to home metadata
    const fallback = PAGE_METADATA.home;
    return {
      title: fallback.titles[locale] || fallback.titles.en,
      description: fallback.descriptions[locale] || fallback.descriptions.en,
      keywords: fallback.keywords[locale] || fallback.keywords.en,
    };
  }

  return {
    title: metadata.titles[locale] || metadata.titles.en,
    description: metadata.descriptions[locale] || metadata.descriptions.en,
    keywords: metadata.keywords[locale] || metadata.keywords.en,
  };
}

/**
 * Get keywords as string for meta tags
 */
export function getKeywordsString(page: string, locale: Locale): string {
  const metadata = getPageMetadata(page, locale);
  return metadata.keywords.join(', ');
}

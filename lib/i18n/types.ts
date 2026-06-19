// Shared types for i18n system
// Can be imported by both server and client components

export interface Dictionary {
  common: {
    nav: {
      tools: string;
      blog: string;
      about: string;
      categories: string;
      lab: string;
      allTools: string;
      viewAllTools: string;
      searchPlaceholder?: string;
    };
    faqSchema?: Array<{ question: string; answer: string }>;
    actions: {
      copy: string;
      download: string;
      clear: string;
      process: string;
      upload: string;
      paste: string;
      reset: string;
      share: string;
      save: string;
      load: string;
      export: string;
      import: string;
      format: string;
      validate: string;
      minify: string;
      beautify: string;
      encode: string;
      decode: string;
      encrypt: string;
      decrypt: string;
      generate: string;
      convert: string;
      analyze: string;
      compare: string;
    };
    messages: {
      success: string;
      error: string;
      copied: string;
      processing: string;
      noData: string;
      invalid: string;
      valid: string;
      loading: string;
      saved: string;
      deleted: string;
      updated: string;
      created: string;
      failed: string;
      warning: string;
      info: string;
    };
    labels: {
      input: string;
      output: string;
      options: string;
      settings: string;
      result: string;
      preview: string;
      source: string;
      target: string;
      from: string;
      to: string;
      file: string;
      text: string;
      code: string;
      data: string;
      format: string;
      type: string;
      mode: string;
      language: string;
      charset: string;
      encoding: string;
      tool: string;
      tools: string;
    };
    units: {
      bytes: string;
      kb: string;
      mb: string;
      gb: string;
      ms: string;
      seconds: string;
      minutes: string;
      hours: string;
      days: string;
      characters: string;
      words: string;
      lines: string;
    };
  };
  home: {
    hero: {
      title: string;
      subtitle: string;
      description: string;
    };
    features: {
      title: string;
      fast: {
        title: string;
        description: string;
      };
      secure: {
        title: string;
        description: string;
      };
      free: {
        title: string;
        description: string;
      };
    };
    categories: {
      title: string;
      viewAll: string;
    };
    popular: {
      title: string;
      subtitle: string;
    };
    whyToolsLab: {
      title: string;
      subtitle: string;
      footer: string;
      benefits: {
        instantProcessing: {
          title: string;
          description: string;
        };
        zeroDataStorage: {
          title: string;
          description: string;
        };
        chainTools: {
          title: string;
          description: string;
        };
        darkMode: {
          title: string;
          description: string;
        };
        worksEverywhere: {
          title: string;
          description: string;
        };
        noSignup: {
          title: string;
          description: string;
        };
      };
    };
    trustMetrics: {
      dailyOperations: string;
      privacyFocused: string;
      processingTime: string;
      activeUsers: string;
    };
    poweredBy: {
      title: string;
      subtitle: string;
      github: {
        name: string;
        description: string;
      };
      vercel: {
        name: string;
        description: string;
      };
      umami: {
        name: string;
        description: string;
      };
      cloudflare: {
        name: string;
        description: string;
      };
      porkbun: {
        name: string;
        description: string;
      };
    };
    interactiveDemo: {
      title: string;
      subtitle: string;
      action: string;
      searchPlaceholder: string;
      searchButton: string;
      copyButton: string;
      copied: string;
      viewTool: string;
    };
    toolDiscovery: {
      title: string;
      subtitle: string;
      tabs: {
        api: {
          label: string;
          description: string;
        };
        data: {
          label: string;
          description: string;
        };
        web: {
          label: string;
          description: string;
        };
        security: {
          label: string;
          description: string;
        };
        productivity: {
          label: string;
          description: string;
        };
      };
      viewTool: string;
      exploreAll: string;
    };
    seoContent: {
      title: string;
      mainTitle: string;
      intro: string;
      builtForDevs: {
        title: string;
        description: string;
      };
      ctaBox: {
        title: string;
        description: string;
      };
      features: {
        lightningFast: {
          title: string;
          description: string;
        };
        private: {
          title: string;
          description: string;
        };
        toolChaining: {
          title: string;
          description: string;
        };
        worksEverywhere: {
          title: string;
          description: string;
        };
      };
      faqs: {
        different: {
          question: string;
          answer: string;
        };
        free: {
          question: string;
          answer: string;
        };
        privacy: {
          question: string;
          answer: string;
        };
        commercial: {
          question: string;
          answer: string;
        };
        browsers: {
          question: string;
          answer: string;
        };
      };
    };
    footerCTA: {
      title: string;
      subtitle: string;
      description: string;
      button: string;
      quickAccess: string;
    };
  };
  tools: Record<
    string,
    {
      title: string;
      description: string;
      placeholder?: string;
      instructions?: string;
      features?: string[];
      meta: {
        title: string;
        description: string;
      };
      labels?: Record<string, string>;
      messages?: Record<string, string>;
      options?: Record<string, string>;
    }
  >;
  categories: Record<
    string,
    {
      name: string;
      description: string;
    }
  >;
  footer: {
    aboutToolsLab: string;
    aboutDescription: string;
    learnMission: string;
    quickLinks: string;
    home: string;
    allTools: string;
    categories: string;
    yourLab: string;
    about: string;
    popularTools: string;
    support: string;
    buyMeCoffee: string;
    privacy: string;
    terms: string;
    copyright: string;
    craftedIn: string;
    madeWith: string;
    developedBy: string;
  };
  seo: {
    suffix: string;
    defaultDescription: string;
  };
  lab: {
    header: {
      title: string;
      subtitle: string;
    };
    overview: {
      favoriteTools: string;
      recentlyUsed: string;
      used: string;
      ago: string;
      justNow: string;
      minutesAgo: string;
      hoursAgo: string;
      daysAgo: string;
    };
    sidebar: {
      myTools: string;
      overview: string;
      starToolsToAdd: string;
    };
    welcome: {
      title: string;
      description: string;
      howItWorks: string;
      howItWorksDescription: string;
      privacyTitle: string;
      privacyDescription: string;
      gotIt: string;
      dontShowAgain: string;
    };
    empty: {
      title: string;
      description: string;
      toAddThem: string;
      exploreTools: string;
      browseCategories: string;
      proTips: string;
      tip1: string;
      tip2: string;
      tip3: string;
      headerTitle: string;
      headerSubtitle: string;
      headerTagline: string;
      headerDescription: string;
      trustBadge1: string;
      trustBadge2: string;
      trustBadge3: string;
      introDescription: string;
      mainMessage: string;
      mainDescription: string;
      exploreAllTools: string;
      proTipsTitle: string;
      proTip1: string;
      proTip2: string;
      proTip3: string;
      seoTitle: string;
      seoIntro: string;
      privacyControlTitle: string;
      privacyControlDescription: string;
      workflowOptimizationTitle: string;
      workflowOptimizationDescription: string;
      needMoreTools: string;
      needMoreToolsDescription: string;
      browseAllTools: string;
      popularToolsTitle: string;
      popularToolsSubtitle: string;
      howItWorksTitle: string;
      step1Title: string;
      step1Description: string;
      step2Title: string;
      step2Description: string;
      step3Title: string;
      step3Description: string;
      categoriesTitle: string;
      categoriesSubtitle: string;
      trustPrivacyTitle: string;
      trustPrivacyDescription: string;
      trustFreeTitle: string;
      trustFreeDescription: string;
      trustNoSignupTitle: string;
      trustNoSignupDescription: string;
      bottomCtaTitle: string;
      bottomCtaDescription: string;
    };
    helpButton: {
      title: string;
      ariaLabel: string;
    };
  };
  terms: {
    meta: {
      title: string;
      description: string;
      ogTitle: string;
      ogDescription: string;
    };
    header: {
      title: string;
      subtitle: string;
      tldrTitle: string;
      tldrText: string;
    };
    lastUpdated: string;
    sections: {
      freeService: {
        title: string;
        intro: string;
        points: {
          noCost: string;
          noAccount: string;
          noFreemium: string;
          noLimits: string;
          openSource: string;
        };
        promise: string;
      };
      warranties: {
        title: string;
        disclaimer: string;
        disclaimerText: string;
        intro: string;
        points: {
          functionality: string;
          accuracy: string;
          bugs: string;
          dataLoss: string;
          security: string;
        };
      };
    };
  };
  privacy: {
    meta: {
      title: string;
      description: string;
      ogTitle: string;
      ogDescription: string;
    };
    header: {
      title: string;
      subtitle: string;
      tldrTitle: string;
      tldrText: string;
    };
    lastUpdated: string;
    sections: {
      zeroData: {
        title: string;
        intro: string;
        points: {
          noEmail: string;
          noNames: string;
          noAccounts: string;
          noCookies: string;
          noSensitive: string;
        };
        summary: string;
      };
      localProcessing: {
        title: string;
        intro: string;
        points: {
          json: string;
          base64: string;
          uuid: string;
          noServers: string;
          offline: string;
        };
        summary: string;
      };
    };
  };
  blog: {
    title: string;
    subtitle: string;
    featured: string;
    recentArticles: string;
    loadMore: string;
    loading: string;
    comingSoon: string;
    comingSoonDescription: string;
    readMore: string;
    minRead: string;
    publishedOn: string;
    lastUpdated: string;
    author: string;
    relatedArticles: string;
    tableOfContents: string;
    shareArticle: string;
    copyLink: string;
    linkCopied: string;
    categories: {
      Tutorial: string;
      Guide: string;
      Comparison: string;
      'Best Practices': string;
      'Deep Dive': string;
    };
    fallbackNotice: string;
    availableIn: string;
    pillarArticle: string;
  };
}

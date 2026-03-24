export type Language = 'EN' | 'DE';

export const translations = {
  EN: {
    // Navigation
    nav: {
      home: 'Home',
      events: 'Events',
      club: 'Club',
      location: 'Location',
      rental: 'Rental',
      career: 'Career',
      admin: 'Admin',
      getTickets: 'Get Tickets',
    },
    // Hero
    hero: {
      subtitle: 'Hard Techno Club in Basel',
      description: 'No racism. No hate. Just music. Experience the raw energy of underground techno in the heart of Basel.',
      viewEvents: 'View Events',
      aboutUs: 'About Us',
    },
    // Location Preview
    location: {
      findUs: 'Find Us',
      viewDetails: 'View Details',
      address: 'Barcelona-Strasse 4, 4142 Münchenstein, Switzerland',
    },
    // Newsletter
    newsletter: {
      title: 'STAY IN THE LOOP',
      subtitle: 'Newsletter',
      description: 'Subscribe to our newsletter and be the first to know about upcoming events, ticket sales, and exclusive offers.',
      placeholder: 'Enter your email',
      subscribe: 'Subscribe',
      success: 'You have successfully subscribed!',
      privacy: 'By subscribing, you agree to our privacy policy.',
      errorInvalid: 'Please enter a valid email address',
      errorMessage: 'Failed to subscribe. Please try again.',
    },
    // Footer
    footer: {
      rights: 'All rights reserved.',
      imprint: 'Imprint',
      privacy: 'Privacy Policy',
      contact: 'Contact',
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      close: 'Close',
      send: 'Send',
      submit: 'Submit',
    },
    // Rental Page
    rental: {
      title: 'VENUE RENTAL',
      subtitle: 'Event Venue',
      description: "Looking for the perfect venue for your event? Whether it's a concert, birthday party, or corporate event - our spaces offer everything you need for a seamless event. Thanks to our ideal location in the heart of the Dreispitz area and state-of-the-art lighting and sound technology, we have everything you need for your event.",
      availableRooms: 'Available Rooms',
      included: 'Included',
      includedList: [
        'Electricity',
        'Restroom usage',
        'Lighting & PA',
        'Use of chairs and tables',
      ],
      extras: 'Optional Extras',
      submitInquiry: 'Submit Inquiry',
      inquirySubtitle: "Don't hesitate to contact us with your ideas. We look forward to hearing from you!",
      form: {
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        eventType: 'Event Type',
        date: 'Preferred Date',
        guests: 'Number of Guests',
        rooms: 'Preferred Rooms',
        message: 'Message',
        placeholder: {
          name: 'Your name',
          email: 'your@email.com',
          phone: '+41 79 123 45 67',
          eventType: 'e.g. Concert, Birthday, Corporate Event',
          guests: '50',
          message: 'Tell us more about your planned event...',
        },
        sendInquiry: 'Send Inquiry',
      },
      success: {
        title: 'Request Sent!',
        message: 'Thank you for your inquiry. We will get back to you as soon as possible.',
      },
      rooms: {
        wohnzimmer: {
          description: 'Large room with living room atmosphere in the basement',
          features: [
            'Professional lighting system & high-end Funktion-One sound system',
            'Unique DJ booth with modern sound technology',
            'Open bar with competent and trained staff',
            'Adjustable room size with curtains',
          ],
        },
        bunker: {
          description: 'Large and dark room in the basement',
          features: [
            'Professional lighting system & high-end Kling&Freitag sound system',
            'DJ booth and stage possibilities',
            'Bar with competent and trained staff',
          ],
        },
        aussenbereich: {
          description: '20m² small covered outdoor area',
          features: [
            'Can be used as smoking area',
            'Covered',
          ],
        },
      },
      extrasList: [
        'Catering',
        'Lounge and theater seating',
        'Stage for concerts',
        'Banquet furniture',
        'Lighting technician',
        'Sound technician',
        'DJ',
        'Bar service',
      ],
    },
    // Career Page
    career: {
      title: 'JOIN THE TEAM',
      subtitle: 'Career',
      description: 'Are you passionate, engaged, and love the event and club culture? Then you are exactly right with us! We are constantly looking for talented people who want to strengthen our team.',
      benefits: 'Your Benefits',
      openPositions: 'Open Positions',
      applyNow: 'Apply Now',
      form: {
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        phone: 'Phone',
        position: 'Desired Position',
        message: 'Why do you want to join us?',
        placeholder: {
          firstName: 'Max',
          lastName: 'Mustermann',
          message: 'Tell us about yourself and why you want to join the KINKER team...',
        },
        submit: 'Submit Application',
      },
      success: {
        title: 'Application Sent!',
        message: 'Thank you for your interest. We will review your application and get back to you as soon as possible.',
      },
    },
    // Merch Page
    merch: {
      title: 'MERCH',
      subtitle: 'Official Store',
      description: 'Show your love for KINKER with our official merchandise. From hoodies to accessories - wear the underground.',
      empty: 'No items available',
      addToCart: 'Add to Cart',
      cart: 'Cart',
      emptyCart: 'Your cart is empty',
      subtotal: 'Subtotal',
      checkout: 'Checkout',
      continueShopping: 'Continue Shopping',
      size: 'Size',
      quantity: 'Quantity',
      stock: 'Stock',
      outOfStock: 'Out of Stock',
      lowStock: 'Only {count} left',
      categories: {
        clothing: 'Clothing',
        accessories: 'Accessories',
        music: 'Music',
        other: 'Other',
      },
    },
    // Location Page
    locationPage: {
      title: 'LOCATION',
      subtitle: 'Find Us',
      description: "Located in Münchenstein's industrial district, KINKER is easily accessible by public transport, car, or taxi. Parking garage available opposite the club.",
      address: 'Address',
      directions: 'Directions',
      publicTransport: 'Public Transport',
      byCar: 'By Car',
      parking: 'Parking',
      hotels: 'Hotels Nearby',
      budget: 'Budget',
      midRange: 'Mid-Range',
      luxury: 'Luxury',
      priceDisclaimer: '* Prices are estimates and may vary by season. Early booking recommended.',
    },
    // Club Page
    club: {
      title: 'THE CLUB',
      subtitle: 'About Us',
      description: 'KINKER is more than just a club. We are a community of music lovers, artists, and free spirits who come together to celebrate the underground techno culture.',
      values: 'Our Values',
      faq: 'FAQ',
      entryRules: 'Entry Rules',
    },
    // Events Page
    events: {
      title: 'UPCOMING EVENTS',
      subtitle: 'Events',
      description: 'Discover our upcoming events and secure your tickets now. From hard techno nights to special festivals - experience the best of the underground scene.',
      noEvents: 'No events found.',
      buyTickets: 'Buy Tickets',
      lineup: 'Lineup',
      details: 'Details',
      filters: {
        all: 'All Events',
        clubnight: 'Club Nights',
        special: 'Special Events',
        festival: 'Festivals',
      },
      whatsOn: "What's On",
      viewDetails: 'View Details',
      tickets: 'Tickets',
      more: 'more',
    },
    // Homepage
    home: {
      hero: {
        viewEvents: 'View Events',
        aboutClub: 'About Club',
      },
      events: {
        subtitle: 'Experience the underground. Book your tickets now.',
        viewAll: 'View All Events',
      },
      about: {
        subtitle: 'Our Philosophy',
        description: 'KINKER is a sanctuary for those who seek the raw energy of underground techno. We believe in the power of music to unite, to liberate, and to transform. Our space is built on respect, inclusivity, and the shared love of hard beats.',
      },
      newsletter: {
        description: 'Subscribe to our newsletter for exclusive events, ticket pre-sales, and underground news.',
        placeholder: 'Enter your email',
        subscribe: 'Subscribe',
        subscribing: 'Subscribing...',
        privacy: 'No spam. Unsubscribe anytime. We respect your privacy.',
      },
    },
  },
  DE: {
    // Navigation
    nav: {
      home: 'Start',
      events: 'Events',
      club: 'Club',
      location: 'Location',
      rental: 'Vermietung',
      career: 'Karriere',
      admin: 'Admin',
      getTickets: 'Tickets',
    },
    // Hero
    hero: {
      subtitle: 'Hard Techno Club in Basel',
      description: 'Kein Rassismus. Kein Hass. Nur Musik. Erlebe die rohe Energie des Underground Techno im Herzen von Basel.',
      viewEvents: 'Events ansehen',
      aboutUs: 'Über uns',
    },
    // Location Preview
    location: {
      findUs: 'Finde uns',
      viewDetails: 'Details ansehen',
      address: 'Barcelona-Strasse 4, 4142 Münchenstein, Schweiz',
    },
    // Newsletter
    newsletter: {
      title: 'BLEIB IM LOOP',
      subtitle: 'Newsletter',
      description: 'Abonniere unseren Newsletter und sei der Erste, der über kommende Events, Ticketverkäufe und exklusive Angebote erfährt.',
      placeholder: 'Deine E-Mail eingeben',
      subscribe: 'Abonnieren',
      success: 'Du hast dich erfolgreich angemeldet!',
      privacy: 'Mit der Anmeldung stimmst du unserer Datenschutzerklärung zu.',
      errorInvalid: 'Bitte gib eine gültige E-Mail-Adresse ein',
      errorMessage: 'Abonnement fehlgeschlagen. Bitte versuche es erneut.',
    },
    // Footer
    footer: {
      rights: 'Alle Rechte vorbehalten.',
      imprint: 'Impressum',
      privacy: 'Datenschutz',
      contact: 'Kontakt',
    },
    // Common
    common: {
      loading: 'Laden...',
      error: 'Ein Fehler ist aufgetreten',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      create: 'Erstellen',
      search: 'Suchen',
      close: 'Schliessen',
      send: 'Senden',
      submit: 'Absenden',
    },
    // Rental Page
    rental: {
      title: 'RAUMVERMIETUNG',
      subtitle: 'Eventlocation',
      description: 'Du bist auf der Suche nach der passenden Eventlocation für deinen Anlass? Egal ob Konzert, Geburtstag oder Firmenanlass - in unseren Räumlichkeiten findest du alles, was du für einen reibungslosen Event brauchst. Dank idealer Lage im Herzen des Dreispitzareals und modernster Licht- und Tontechnik haben wir alles, was du für deinen Event brauchst.',
      availableRooms: 'Verfügbare Räume',
      included: 'Inkludiert',
      includedList: [
        'Strom',
        'Toilettennutzung',
        'Licht- & PA',
        'Nutzung Stühle und Tische',
      ],
      extras: 'Zusatzleistungen',
      submitInquiry: 'Anfrage stellen',
      inquirySubtitle: 'Zögere nicht, uns mit deinen Ideen zu kontaktieren. Wir freuen uns auf dich!',
      form: {
        name: 'Name',
        email: 'E-Mail',
        phone: 'Telefon',
        eventType: 'Anlass',
        date: 'Gewünschtes Datum',
        guests: 'Anzahl Gäste',
        rooms: 'Gewünschte Räume',
        message: 'Nachricht',
        placeholder: {
          name: 'Dein Name',
          email: 'deine@email.ch',
          phone: '+41 79 123 45 67',
          eventType: 'z.B. Konzert, Geburtstag, Firmenanlass',
          guests: '50',
          message: 'Erzähle uns mehr über deinen geplanten Anlass...',
        },
        sendInquiry: 'Anfrage senden',
      },
      success: {
        title: 'Anfrage gesendet!',
        message: 'Vielen Dank für deine Anfrage. Wir melden uns so schnell wie möglich bei dir.',
      },
      rooms: {
        wohnzimmer: {
          description: 'Grosser Raum mit Wohnzimmerflair im Untergeschoss',
          features: [
            'Professionelles Lichtsystem & high-end Funktion-One Soundsystem',
            'Einzigartige DJ-Booth mit modernster Tontechnik',
            'Offene Bar mit kompetentem und eingeschultem Personal',
            'Verstellbare Raumgrösse durch Vorhang',
          ],
        },
        bunker: {
          description: 'Grosser und dunkler Raum im Untergeschoss',
          features: [
            'Professionelles Lichtsystem & high-end Kling&Freitag Soundsystem',
            'DJ-Booth und Bühnenmöglichkeiten',
            'Bar mit kompetentem und eingeschultem Personal',
          ],
        },
        aussenbereich: {
          description: '20m² kleiner überdachter Aussenbereich',
          features: [
            'Kann als Fumoir verwendet werden',
            'Überdacht',
          ],
        },
      },
      extrasList: [
        'Catering',
        'Lounge- und Theaterbestuhlung',
        'Bühne für Konzerte',
        'Bankettmobiliar',
        'Lichttechniker',
        'Tontechniker',
        'DJ',
        'Barbetrieb',
      ],
    },
    // Career Page
    career: {
      title: 'WERDE TEIL DES TEAMS',
      subtitle: 'Karriere',
      description: 'Du bist leidenschaftlich, engagiert und liebst die Event- und Clubkultur? Dann bist du bei uns genau richtig! Wir suchen ständig nach talentierten Menschen, die unser Team verstärken wollen.',
      benefits: 'Deine Vorteile',
      openPositions: 'Offene Stellen',
      applyNow: 'Jetzt bewerben',
      form: {
        firstName: 'Vorname',
        lastName: 'Nachname',
        email: 'E-Mail',
        phone: 'Telefon',
        position: 'Gewünschte Position',
        message: 'Warum möchtest du zu uns?',
        placeholder: {
          firstName: 'Max',
          lastName: 'Mustermann',
          message: 'Erzähle uns von dir und warum du Teil des KINKER Teams werden möchtest...',
        },
        submit: 'Bewerbung absenden',
      },
      success: {
        title: 'Bewerbung gesendet!',
        message: 'Vielen Dank für dein Interesse. Wir prüfen deine Bewerbung und melden uns so schnell wie möglich bei dir.',
      },
    },
    // Merch Page
    merch: {
      title: 'MERCH',
      subtitle: 'Official Store',
      description: 'Zeige deine Liebe zu KINKER mit unserem offiziellen Merchandise. Von Hoodies bis Accessoires - trag den Underground.',
      empty: 'Keine Artikel verfügbar',
      addToCart: 'In den Warenkorb',
      cart: 'Warenkorb',
      emptyCart: 'Dein Warenkorb ist leer',
      subtotal: 'Zwischensumme',
      checkout: 'Zur Kasse',
      continueShopping: 'Weiter einkaufen',
      size: 'Grösse',
      quantity: 'Anzahl',
      stock: 'Lagerbestand',
      outOfStock: 'Ausverkauft',
      lowStock: 'Nur noch {count} verfügbar',
      categories: {
        clothing: 'Kleidung',
        accessories: 'Accessoires',
        music: 'Musik',
        other: 'Sonstiges',
      },
    },
    // Location Page
    locationPage: {
      title: 'LOCATION',
      subtitle: 'Finde uns',
      description: 'Im Industriegebiet von Münchenstein gelegen, ist KINKER gut mit öffentlichen Verkehrsmitteln, Auto oder Taxi erreichbar. Parkhaus gegenüber des Clubs verfügbar.',
      address: 'Adresse',
      directions: 'Anfahrt',
      publicTransport: 'Öffentliche Verkehrsmittel',
      byCar: 'Mit dem Auto',
      parking: 'Parken',
      hotels: 'Hotels in der Nähe',
      budget: 'Preiswert',
      midRange: 'Mittelklasse',
      luxury: 'Gehoben',
      priceDisclaimer: '* Preise sind Richtwerte und können je nach Saison variieren. Empfohlen wird eine frühzeitige Buchung.',
    },
    // Club Page
    club: {
      title: 'DER CLUB',
      subtitle: 'Über uns',
      description: 'KINKER ist mehr als nur ein Club. Wir sind eine Gemeinschaft von Musikliebhabern, Künstlern und freien Geistern, die zusammenkommen, um die Underground-Techno-Kultur zu feiern.',
      values: 'Unsere Werte',
      faq: 'FAQ',
      entryRules: 'Einlassregeln',
    },
    // Events Page
    events: {
      title: 'KOMMENDE EVENTS',
      subtitle: 'Events',
      description: 'Entdecke unsere kommenden Events und sichere dir jetzt deine Tickets. Von Hard-Techno-Nächten bis zu Special-Festivals - erlebe das Beste der Underground-Szene.',
      noEvents: 'Keine Events gefunden.',
      buyTickets: 'Tickets kaufen',
      lineup: 'Lineup',
      details: 'Details',
      filters: {
        all: 'Alle Events',
        clubnight: 'Club Nights',
        special: 'Special Events',
        festival: 'Festivals',
      },
      whatsOn: "What's On",
      viewDetails: 'Details ansehen',
      tickets: 'Tickets',
      more: 'weitere',
    },
    // Homepage
    home: {
      hero: {
        viewEvents: 'Events ansehen',
        aboutClub: 'Über den Club',
      },
      events: {
        subtitle: 'Erlebe den Underground. Buche jetzt deine Tickets.',
        viewAll: 'Alle Events ansehen',
      },
      about: {
        subtitle: 'Unsere Philosophie',
        description: 'KINKER ist ein Zufluchtsort für alle, die die rohe Energie des Underground Techno suchen. Wir glauben an die Kraft der Musik, um zu vereinen, zu befreien und zu transformieren. Unser Raum ist geprägt von Respekt, Inklusivität und der gemeinsamen Liebe zu harten Beats.',
      },
      newsletter: {
        description: 'Abonniere unseren Newsletter für exklusive Events, Ticket-Vorverkäufe und Underground-News.',
        placeholder: 'Deine E-Mail eingeben',
        subscribe: 'Abonnieren',
        subscribing: 'Wird abonniert...',
        privacy: 'Kein Spam. Jederzeit abmelden. Wir respektieren deine Privatsphäre.',
      },
    },
  },
};

export type Translations = typeof translations.EN;

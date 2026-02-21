/** Theme: colors and typography. Applied to the invitation. */
export interface EventTheme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  /** Main body text color (hex) */
  textColor?: string;
  /** Heading color (e.g. couple name) (hex) */
  headingColor?: string;
  /** Link color (hex) */
  linkColor?: string;
  /** Button background (hex) */
  buttonBgColor?: string;
  /** Button text (hex) */
  buttonTextColor?: string;
  /** Border / divider color (hex) */
  borderColor?: string;
  /** Heading font (Google Font name, e.g. "Pinyon Script") */
  fontHeading?: string;
  /** Body font (e.g. "Cinzel", "Cormorant Garamond") */
  fontBody?: string;
  /** Base font size (e.g. "16px" or "1rem") */
  fontSizeBase?: string;
  /** Heading font size scale (e.g. "3rem" or "1.5") */
  fontSizeHeading?: string;
}

/** Which sections to show on the invitation. Omitted = true. */
export interface EventSections {
  welcome?: boolean;
  cardViewer?: boolean;
  weddingInfo?: boolean;
  spotify?: boolean;
  rsvp?: boolean;
}

/** Event config shape (same as wedding.json) for any event type */
export interface EventConfig {
  weddingDate?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  ceremonyTime?: string;
  churchName?: string;
  churchAddress?: string;
  churchMap?: string;
  receptionTime?: string;
  venueName?: string;
  venueAddress?: string;
  venueMap?: string;
  coupleNames?: string;
  images?: {
    invitation?: { front?: string; back?: string; envelope?: string };
    moments?: string[];
  };
  groomMotherName?: string;
  groomFatherName?: string;
  brideMotherName?: string;
  brideFatherName?: string;
  brideLastName?: string;
  groomLastName?: string;
  groomPhoneNumber?: string;
  bridePhoneNumber?: string;
  spotifyId?: string;
  rsvpDeadline?: string;
  /** Which RSVP form steps to show. Omitted or true = show. Set to false to hide (e.g. no music collection). */
  rsvpSteps?: {
    collectMusic?: boolean;
    collectNote?: boolean;
  };
  theme?: EventTheme;
  sections?: EventSections;
  /** Custom footer line (replaces default "Developed with love") */
  footerText?: string;
  /** Optional tagline under couple name on welcome (e.g. "We're getting married!") */
  welcomeTagline?: string;
  /** Optional free-form paragraph (supports emojis, newlines) shown on the invitation */
  customParagraph?: string;
  /** Important notes: 3 boxes with emoji, title, subtitle; subtitle can be a link if href is set */
  importantNotes?: Array<{
    emoji?: string;
    title?: string;
    subtitle?: string;
    href?: string;
  }>;
  /** Meta tags for invitee URLs when shared (og:title, og:description, og:image, etc.) */
  shareMeta?: {
    title?: string;
    description?: string;
    /** Thumbnail image URL for link previews (e.g. invitation front or custom image) */
    image?: string;
  };
}

export interface Event {
  id: string;
  slug: string;
  name: string;
  config: EventConfig;
}

export interface Guest {
  id: string;
  token: string;
  name: string;
  partnerName?: string | null;
  maxExtraGuests?: number;
}

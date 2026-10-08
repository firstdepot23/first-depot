import { company as c } from "./company";
import { p, ul, type DocPage } from "./schema";

// Deliberately limited to who we are, what we stand for and who we serve.
// Internal strategy, business model and marketing plans are NOT published here.

export const about: DocPage = {
  slug: "about",
  title: "About the Business",
  subtitle: c.tagline,
  blurb: "who we are and what we stand for",
  group: "Company",
  updated: "October 2026",
  intro: [
    p(
      `${c.legalName} is a Ugandan hardware and home improvement company. We supply paints, electricals, pumps and plumbing, tiles and building materials to homeowners, builders and businesses, 
      and we deliver them to where the work is happening.
      Home improvement is not only about building materials, construction, repairs, or renovation. 
      It is also about creating a space that people are proud to call home.
Therefore we also provide the right accessories, furnishings, finishes, lighting, colors, decor, electricals, electronics and everyday home products that can transform an ordinary house into a warm, beautiful, and comfortable living space. We also provide logistics & supply chain services such as transportation and warehousing as a business to business or business to consumer service as stated in our Company Memorandum & Articles of Association
      `,
    ),
    p(
      `We started with a simple idea: buying what you need to improve your home should be easy, fairly priced and free of surprises. And that home improvement goes beyond construction and renovation. It is about providing the "materials, accessories, products, and ideas that help people create spaces where they can live comfortably and enjoy life together`,
    ),
  ],
  sections: [
    {
      id: "mission",
      title: "Our mission",
      blocks: [
        p(
          `Our hardware store aims to provide top-notch hardware products, revolutionary strategies and unmatched customer experience.`,
        ),
      ],
    },
    {
      id: "vision",
      title: "Our vision",
      blocks: [
        p(
          `Leading Uganda’s transition into a Services driven economy through improvements in infrastructure.`,
        ),
      ],
    },
    {
      id: "philosophy",
      title: "What we believe",
      blocks: [
        p(
          `Our philosophy is to help people solve their problems. Every decision we make, from the products we stock to the way we deliver them, has to answer one question: does this help a customer get their project done?`,
        ),
        p(
          `We build our brand around comfort: the comfort of a well-finished home, of products that last, and of knowing the people you buy from will stand behind them.`,
        ),
      ],
    },
    {
      id: "goals",
      title: "What we care about",
      blocks: [
        ul(
          "**Being customer centric.** We listen first, advise honestly and fix mistakes quickly.",
          "**Sustainability.** We choose durable products, reduce packaging waste and look for ways to reuse and recycle.",
          "**Home improvement.** From a single tin of paint to a whole building, we want to make improvement within reach.",
        ),
      ],
    },
    {
      id: "customers",
      title: "Who we serve",
      blocks: [
        p(`We work with three kinds of customer:`),
        ul(
          "**Individuals.** Homeowners, builders, painters and enthusiasts, including woodworkers and weekend project makers.",
          "**Professionals.** Contractors, maintenance workers and other tradespeople who need dependable supply.",
          "**Businesses and institutions.** Construction companies, property managers and public bodies working on roads, bridges and public buildings.",
        ),
      ],
    },
    {
      id: "range",
      title: "What we sell",
      blocks: [
        p(
          `Quality paints and painting materials at affordable prices are where we began, and our range has grown to include electricals, pumps and plumbing, tiles, building materials and general hardware. See the full list on our [Products](/docs/products) page.`,
        ),
      ],
    },
    {
      id: "visit",
      title: "Visit or get in touch",
      blocks: [
        p(
          `Our showroom is at ${c.address}. Details of opening hours, phone numbers and email addresses are on the [Contacts](/docs/contacts) page.`,
        ),
      ],
    },
  ],
};

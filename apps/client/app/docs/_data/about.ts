import { company as c, inc } from "./company";
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
      `First Depot is a group of companies led by ${inc.legalName}, ${inc.description}. It builds and runs the technology behind three businesses registered in Uganda: ${c.legalName} (hardware and home improvement), OxPharm Health Limited (pharmacy) and MD Clove (groceries).`,
    ),
    p(
      `${c.legalName} is where we began. It is a Ugandan hardware and home improvement company that supplies paints, electricals, pumps and plumbing, tiles and building materials to homeowners, builders and businesses, and delivers them to where the work is happening. We also provide logistics and supply chain services, such as transportation and warehousing, to businesses and to consumers, as set out in our Memorandum and Articles of Association.`,
    ),
    p(
      `Home improvement is not only about building materials, construction, repairs or renovation. It is also about creating a space that people are proud to call home. So we also provide the accessories, furnishings, finishes, lighting, colours, decor, electricals, electronics and everyday home products that can turn an ordinary house into a warm, beautiful and comfortable living space. Through OxPharm Health and MD Clove, we also supply the health, wellness, food and household essentials that families need every day.`,
    ),
    p(
      `We started with a simple idea: buying what you need to improve your home should be easy, fairly priced and free of surprises, and home improvement goes beyond construction and renovation. It is about providing the materials, accessories, products and ideas that help people create spaces where they can live comfortably and enjoy life together.`,
    ),
  ],
  sections: [
    {
      id: "mission",
      title: "Our mission",
      blocks: [
        p(
          `Our group aims to provide top-notch products, revolutionary strategies and unmatched customer experience.`,
        ),
      ],
    },
    {
      id: "vision",
      title: "Our vision",
      blocks: [
        p(
          `Leading Uganda’s transition into a services-driven economy through improvements in infrastructure.`,
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
          "**Technology that serves people.** We build our own software so that ordering, delivery and payment are simple for customers and dependable for the shops.",
        ),
      ],
    },
    {
      id: "customers",
      title: "Who we serve",
      blocks: [
        p(`We work with three kinds of customer:`),
        ul(
          "**Individuals.** Homeowners, builders, painters and enthusiasts, including woodworkers and weekend project makers, and families shopping for groceries and everyday health products.",
          "**Professionals.** Contractors, maintenance workers and other tradespeople who need dependable supply.",
          "**Businesses and institutions.** Construction companies, property managers and public bodies working on roads, bridges and public buildings, and businesses that run their sales and stock on our software.",
        ),
      ],
    },
    {
      id: "range",
      title: "What we sell",
      blocks: [
        p(
          `Quality paints and painting materials at affordable prices are where we began, and our range has grown to include electricals, pumps and plumbing, tiles, building materials and general hardware, plus groceries and pharmacy products. See the full list on our [Products](/docs/products) page.`,
        ),
      ],
    },
    {
      id: "group",
      title: "The First Depot group",
      blocks: [
        p(
          `${inc.legalName} is the parent company. Three companies registered in Uganda run the shops: ${c.legalName}, OxPharm Health Limited and MD Clove. ${inc.legalName} also builds GLS, the software that runs our own sales and stock, which is open to other businesses too. See [Our Businesses](/docs/businesses) for the full picture.`,
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
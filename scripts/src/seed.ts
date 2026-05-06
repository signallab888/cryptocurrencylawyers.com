import postgres from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  practiceAreasTable,
  specialtiesTable,
  jurisdictionsTable,
} from "../../lib/db/src/schema/index.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const client = new postgres.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const db = drizzle(client);

// ─── PRACTICE AREAS ──────────────────────────────────────────────────────────

const practiceAreaRows = await db
  .insert(practiceAreasTable)
  .values([
    { slug: "regulatory-compliance", name: "Regulatory & Compliance", description: "Navigating securities, commodities, AML/KYC, and licensing obligations for crypto businesses." },
    { slug: "litigation-enforcement", name: "Litigation & Enforcement", description: "Defending and prosecuting crypto-related disputes, fraud recovery, and enforcement actions." },
    { slug: "tax", name: "Tax", description: "Crypto tax planning, reporting compliance, and tax controversy representation." },
    { slug: "transactional", name: "Transactional", description: "Structuring token offerings, DAOs, DeFi protocols, and crypto M&A transactions." },
    { slug: "intellectual-property", name: "Intellectual Property", description: "Patents, trademarks, and IP strategy for blockchain technology and digital assets." },
    { slug: "criminal-defense", name: "Criminal Defense", description: "Defending individuals and entities facing criminal charges related to cryptocurrency." },
    { slug: "estate-planning", name: "Estate Planning & Wealth", description: "Protecting and transferring digital asset wealth across generations." },
  ])
  .onConflictDoNothing()
  .returning({ id: practiceAreasTable.id, slug: practiceAreasTable.slug });

const paMap = Object.fromEntries(practiceAreaRows.map((r) => [r.slug, r.id]));
console.log("Practice areas seeded:", practiceAreaRows.length);

// ─── SPECIALTIES ─────────────────────────────────────────────────────────────

const specialties = [
  // Regulatory & Compliance
  {
    slug: "sec-enforcement-defense",
    name: "SEC Enforcement Defense",
    description: "Representing crypto issuers, exchanges, and executives in SEC investigations, Wells Notices, and enforcement proceedings.",
    practiceAreaSlug: "regulatory-compliance",
    seoMetaTitle: "SEC Enforcement Defense Lawyers for Crypto | CryptocurrencyLawyers",
    seoMetaDescription: "Find experienced SEC enforcement defense attorneys who specialize in cryptocurrency and digital asset investigations, Wells Notices, and securities litigation.",
  },
  {
    slug: "cftc-enforcement-defense",
    name: "CFTC Enforcement Defense",
    description: "Defending crypto derivatives platforms, traders, and DAOs against Commodity Futures Trading Commission investigations and civil enforcement actions.",
    practiceAreaSlug: "regulatory-compliance",
    seoMetaTitle: "CFTC Enforcement Defense Lawyers for Crypto | CryptocurrencyLawyers",
    seoMetaDescription: "Connect with CFTC enforcement defense attorneys specializing in crypto derivatives, digital commodity disputes, and futures trading regulatory matters.",
  },
  {
    slug: "aml-kyc-compliance",
    name: "AML/KYC Compliance",
    description: "Building and auditing anti-money laundering and Know Your Customer programs for exchanges, wallets, and virtual asset service providers.",
    practiceAreaSlug: "regulatory-compliance",
    seoMetaTitle: "Crypto AML/KYC Compliance Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find crypto AML and KYC compliance attorneys who help exchanges, VASPs, and crypto businesses build programs that satisfy FinCEN and FATF requirements.",
  },
  {
    slug: "ofac-sanctions-compliance",
    name: "OFAC & Sanctions Compliance",
    description: "Advising crypto businesses on OFAC sanctions screening, SDN list compliance, and responding to Treasury Department inquiries.",
    practiceAreaSlug: "regulatory-compliance",
    seoMetaTitle: "Crypto OFAC Sanctions Compliance Attorneys | CryptocurrencyLawyers",
    seoMetaDescription: "Find OFAC and sanctions compliance lawyers for cryptocurrency businesses. Get expert help with SDN screening, Treasury inquiries, and sanctions risk programs.",
  },
  {
    slug: "exchange-licensing",
    name: "Exchange Licensing",
    description: "Obtaining money transmitter licenses, BitLicenses, and international VASP registrations for crypto exchanges and financial service providers.",
    practiceAreaSlug: "regulatory-compliance",
    seoMetaTitle: "Crypto Exchange Licensing Attorneys | CryptocurrencyLawyers",
    seoMetaDescription: "Find crypto exchange licensing lawyers who navigate BitLicense, money transmitter licenses, and global VASP registrations for crypto businesses.",
  },
  {
    slug: "mica-compliance",
    name: "MiCA Compliance",
    description: "Guiding crypto asset service providers and token issuers through EU Markets in Crypto-Assets Regulation (MiCA) authorization and compliance.",
    practiceAreaSlug: "regulatory-compliance",
    seoMetaTitle: "MiCA Compliance Lawyers for Crypto | CryptocurrencyLawyers",
    seoMetaDescription: "Find MiCA compliance attorneys helping crypto businesses navigate EU Markets in Crypto-Assets Regulation, CASP authorization, and white paper requirements.",
  },
  {
    slug: "stablecoin-regulation",
    name: "Stablecoin Regulation",
    description: "Advising issuers of fiat-backed, algorithmic, and commodity-backed stablecoins on emerging US and international regulatory frameworks.",
    practiceAreaSlug: "regulatory-compliance",
    seoMetaTitle: "Stablecoin Regulation Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find stablecoin regulation attorneys who advise issuers on reserve requirements, payment stablecoin frameworks, and cross-border compliance obligations.",
  },

  // Litigation & Enforcement
  {
    slug: "crypto-fraud-recovery",
    name: "Crypto Fraud Recovery",
    description: "Recovering digital assets lost to rug pulls, exchange hacks, investment scams, and fraudulent ICOs through civil litigation and law enforcement cooperation.",
    practiceAreaSlug: "litigation-enforcement",
    seoMetaTitle: "Crypto Fraud Recovery Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find crypto fraud recovery attorneys who help victims of rug pulls, exchange hacks, and crypto investment scams recover their stolen digital assets.",
  },
  {
    slug: "crypto-asset-tracing",
    name: "Crypto Asset Tracing",
    description: "Using blockchain forensics and legal process to trace, freeze, and recover stolen or misappropriated cryptocurrency across wallets and exchanges.",
    practiceAreaSlug: "litigation-enforcement",
    seoMetaTitle: "Crypto Asset Tracing Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Connect with crypto asset tracing attorneys who use blockchain forensics and legal tools to locate and recover stolen or misappropriated digital assets.",
  },
  {
    slug: "nft-disputes",
    name: "NFT Disputes",
    description: "Resolving NFT intellectual property conflicts, marketplace fraud, failed mint disputes, and smart contract breach claims.",
    practiceAreaSlug: "litigation-enforcement",
    seoMetaTitle: "NFT Dispute Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find NFT dispute attorneys experienced in NFT IP conflicts, marketplace fraud, failed mints, and smart contract breach litigation.",
  },
  {
    slug: "crypto-class-actions",
    name: "Crypto Class Actions",
    description: "Representing plaintiffs and defendants in securities class actions, derivative suits, and mass arbitrations arising from token projects and exchanges.",
    practiceAreaSlug: "litigation-enforcement",
    seoMetaTitle: "Crypto Class Action Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find crypto class action attorneys for securities suits, derivative claims, and mass arbitrations involving token projects, ICOs, and exchanges.",
  },
  {
    slug: "crypto-bankruptcy",
    name: "Crypto Bankruptcy",
    description: "Representing creditors, debtors, and trustees in crypto exchange and protocol bankruptcies, including asset recovery and claims administration.",
    practiceAreaSlug: "litigation-enforcement",
    seoMetaTitle: "Crypto Bankruptcy Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find crypto bankruptcy attorneys representing creditors and debtors in exchange collapses and protocol insolvencies to maximize asset recovery.",
  },

  // Tax
  {
    slug: "crypto-tax-compliance",
    name: "Crypto Tax Compliance",
    description: "Preparing and reviewing crypto tax returns, FBAR filings, and voluntary disclosures for individuals, funds, and businesses with digital asset activity.",
    practiceAreaSlug: "tax",
    seoMetaTitle: "Crypto Tax Compliance Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find crypto tax compliance attorneys who handle digital asset tax returns, FBAR filings, IRS voluntary disclosures, and cost-basis reporting strategy.",
  },
  {
    slug: "crypto-tax-litigation",
    name: "Crypto Tax Litigation",
    description: "Defending taxpayers in IRS audits, Tax Court proceedings, and criminal tax investigations involving cryptocurrency and digital assets.",
    practiceAreaSlug: "tax",
    seoMetaTitle: "Crypto Tax Litigation Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find crypto tax litigation attorneys who defend clients in IRS audits, Tax Court cases, and criminal tax investigations involving digital assets.",
  },

  // Transactional
  {
    slug: "token-launches",
    name: "Token Launches",
    description: "Structuring legally compliant token sales, SAFTs, and airdrops for blockchain startups seeking to raise capital while navigating securities laws.",
    practiceAreaSlug: "transactional",
    seoMetaTitle: "Token Launch Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find token launch attorneys who structure SAFTs, utility tokens, and compliant fundraising for crypto startups navigating SEC and global securities laws.",
  },
  {
    slug: "dao-formation-governance",
    name: "DAO Formation & Governance",
    description: "Establishing legal wrappers, governance frameworks, and liability protections for decentralized autonomous organizations.",
    practiceAreaSlug: "transactional",
    seoMetaTitle: "DAO Formation & Governance Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find DAO formation attorneys who establish legal wrappers, draft governance frameworks, and structure liability protections for decentralized organizations.",
  },
  {
    slug: "defi-protocol-counsel",
    name: "DeFi Protocol Counsel",
    description: "Advising DeFi protocols on legal structure, terms of service, regulatory risk, and cross-border compliance for lending, trading, and yield platforms.",
    practiceAreaSlug: "transactional",
    seoMetaTitle: "DeFi Protocol Legal Counsel | CryptocurrencyLawyers",
    seoMetaDescription: "Find DeFi protocol attorneys who advise on legal structure, regulatory risk, smart contract terms, and compliance for decentralized finance platforms.",
  },
  {
    slug: "mining-operations-counsel",
    name: "Mining Operations Counsel",
    description: "Advising Bitcoin miners and proof-of-work operations on energy contracts, regulatory permits, land use, and corporate structuring.",
    practiceAreaSlug: "transactional",
    seoMetaTitle: "Crypto Mining Operations Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find crypto mining operations attorneys who handle energy agreements, environmental permits, land use, and entity structuring for mining businesses.",
  },
  {
    slug: "cross-border-crypto-transactions",
    name: "Cross-Border Crypto Transactions",
    description: "Structuring international crypto M&A, investment agreements, and cross-border transfers that satisfy multi-jurisdictional regulatory requirements.",
    practiceAreaSlug: "transactional",
    seoMetaTitle: "Cross-Border Crypto Transaction Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find cross-border crypto transaction attorneys who structure international deals, acquisitions, and transfers across multiple regulatory jurisdictions.",
  },

  // Criminal Defense
  {
    slug: "crypto-money-laundering-defense",
    name: "Crypto Money Laundering Defense",
    description: "Defending individuals and businesses against federal and state criminal charges of money laundering and unlicensed money transmission involving crypto.",
    practiceAreaSlug: "criminal-defense",
    seoMetaTitle: "Crypto Money Laundering Defense Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find crypto money laundering defense attorneys who defend against federal BSA violations, unlicensed money transmission charges, and DOJ crypto investigations.",
  },

  // Estate Planning & Wealth
  {
    slug: "crypto-estate-planning",
    name: "Crypto Estate Planning",
    description: "Creating wills, trusts, and key-management protocols that ensure digital assets pass securely to heirs without loss of access.",
    practiceAreaSlug: "estate-planning",
    seoMetaTitle: "Crypto Estate Planning Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find crypto estate planning attorneys who draft wills, trusts, and digital asset inheritance plans that ensure your heirs can access your cryptocurrency.",
  },
  {
    slug: "crypto-divorce-asset-division",
    name: "Crypto Divorce & Asset Division",
    description: "Identifying, valuing, and equitably dividing cryptocurrency holdings and NFTs in divorce and dissolution proceedings.",
    practiceAreaSlug: "estate-planning",
    seoMetaTitle: "Crypto Divorce & Asset Division Lawyers | CryptocurrencyLawyers",
    seoMetaDescription: "Find crypto divorce attorneys who trace, value, and divide cryptocurrency holdings, NFTs, and digital assets fairly in divorce and separation proceedings.",
  },
];

const specialtyValues = specialties.map(({ practiceAreaSlug, ...s }) => ({
  slug: s.slug,
  name: s.name,
  description: s.description,
  practiceAreaId: paMap[practiceAreaSlug]!,
  seoMetaTitle: s.seoMetaTitle,
  seoMetaDescription: s.seoMetaDescription,
}));

const specialtyRows = await db
  .insert(specialtiesTable)
  .values(specialtyValues)
  .onConflictDoNothing()
  .returning({ id: specialtiesTable.id, slug: specialtiesTable.slug });

console.log("Specialties seeded:", specialtyRows.length);

// ─── JURISDICTIONS ────────────────────────────────────────────────────────────

const US_STATES: { slug: string; name: string }[] = [
  { slug: "alabama", name: "Alabama" },
  { slug: "alaska", name: "Alaska" },
  { slug: "arizona", name: "Arizona" },
  { slug: "arkansas", name: "Arkansas" },
  { slug: "california", name: "California" },
  { slug: "colorado", name: "Colorado" },
  { slug: "connecticut", name: "Connecticut" },
  { slug: "delaware", name: "Delaware" },
  { slug: "florida", name: "Florida" },
  { slug: "georgia", name: "Georgia" },
  { slug: "hawaii", name: "Hawaii" },
  { slug: "idaho", name: "Idaho" },
  { slug: "illinois", name: "Illinois" },
  { slug: "indiana", name: "Indiana" },
  { slug: "iowa", name: "Iowa" },
  { slug: "kansas", name: "Kansas" },
  { slug: "kentucky", name: "Kentucky" },
  { slug: "louisiana", name: "Louisiana" },
  { slug: "maine", name: "Maine" },
  { slug: "maryland", name: "Maryland" },
  { slug: "massachusetts", name: "Massachusetts" },
  { slug: "michigan", name: "Michigan" },
  { slug: "minnesota", name: "Minnesota" },
  { slug: "mississippi", name: "Mississippi" },
  { slug: "missouri", name: "Missouri" },
  { slug: "montana", name: "Montana" },
  { slug: "nebraska", name: "Nebraska" },
  { slug: "nevada", name: "Nevada" },
  { slug: "new-hampshire", name: "New Hampshire" },
  { slug: "new-jersey", name: "New Jersey" },
  { slug: "new-mexico", name: "New Mexico" },
  { slug: "new-york", name: "New York" },
  { slug: "north-carolina", name: "North Carolina" },
  { slug: "north-dakota", name: "North Dakota" },
  { slug: "ohio", name: "Ohio" },
  { slug: "oklahoma", name: "Oklahoma" },
  { slug: "oregon", name: "Oregon" },
  { slug: "pennsylvania", name: "Pennsylvania" },
  { slug: "rhode-island", name: "Rhode Island" },
  { slug: "south-carolina", name: "South Carolina" },
  { slug: "south-dakota", name: "South Dakota" },
  { slug: "tennessee", name: "Tennessee" },
  { slug: "texas", name: "Texas" },
  { slug: "utah", name: "Utah" },
  { slug: "vermont", name: "Vermont" },
  { slug: "virginia", name: "Virginia" },
  { slug: "washington", name: "Washington" },
  { slug: "west-virginia", name: "West Virginia" },
  { slug: "wisconsin", name: "Wisconsin" },
  { slug: "wyoming", name: "Wyoming" },
  { slug: "district-of-columbia", name: "District of Columbia" },
];

const INTERNATIONAL: { slug: string; name: string; countryCode: string }[] = [
  { slug: "united-kingdom", name: "United Kingdom", countryCode: "GB" },
  { slug: "spain", name: "Spain", countryCode: "ES" },
  { slug: "mexico", name: "Mexico", countryCode: "MX" },
  { slug: "canada", name: "Canada", countryCode: "CA" },
  { slug: "australia", name: "Australia", countryCode: "AU" },
  { slug: "singapore", name: "Singapore", countryCode: "SG" },
  { slug: "switzerland", name: "Switzerland", countryCode: "CH" },
  { slug: "european-union", name: "European Union", countryCode: "EU" },
  { slug: "japan", name: "Japan", countryCode: "JP" },
  { slug: "brazil", name: "Brazil", countryCode: "BR" },
];

const jurisdictionValues = [
  ...US_STATES.map((s) => ({ slug: s.slug, name: s.name, countryCode: "US", type: "state" as const })),
  ...INTERNATIONAL.map((c) => ({ slug: c.slug, name: c.name, countryCode: c.countryCode, type: "country" as const })),
];

const jurisdictionRows = await db
  .insert(jurisdictionsTable)
  .values(jurisdictionValues)
  .onConflictDoNothing()
  .returning({ id: jurisdictionsTable.id, slug: jurisdictionsTable.slug });

console.log("Jurisdictions seeded:", jurisdictionRows.length);
console.log("\nSeed complete ✓");
console.log(`  Practice areas: ${practiceAreaRows.length}`);
console.log(`  Specialties:    ${specialtyRows.length}`);
console.log(`  Jurisdictions:  ${jurisdictionRows.length}`);

await client.end();

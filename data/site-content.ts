import type { BlogPost, DoctorDetail, FAQItem, NavItem, Service, Testimonial } from "@/types/site";

export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Doctor", href: "/doctor" },
  { label: "Appointment", href: "/appointment" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export const services: Service[] = [
  {
    title: "Preventive Medicine",
    description: "Wellness checks, vaccinations, parasite prevention, and nutrition programs tailored to your pet’s life stage.",
    blurb: "Long-term health starts with early prevention.",
  },
  {
    title: "Diagnostics & Imaging",
    description: "Rapid in-house blood work, imaging, and screening protocols to support precise decisions with confidence.",
    blurb: "Fast answers for better treatment paths.",
  },
  {
    title: "Surgical Care",
    description: "Modern surgical planning with rigorous safety standards and detailed recovery guidance for a calm patient experience.",
    blurb: "Carefully planned procedures and attentive support.",
  },
  {
    title: "Dental & Oral Health",
    description: "Gentle oral examinations and dental treatments to protect comfort, appetite, and overall health.",
    blurb: "Comfortable care for better quality of life.",
  },
  {
    title: "Internal Medicine",
    description: "Comprehensive oversight for chronic conditions, specialist-level follow-up, and coordinated care plans.",
    blurb: "Personalized treatment for complex cases.",
  },
  {
    title: "Urgent & Wellness Guidance",
    description: "Concierge support for questions, follow-up plans, and timely guidance when your pet needs reassurance.",
    blurb: "Trusted guidance when it matters most.",
  },
];

export const doctorDetails: DoctorDetail[] = [
  { title: "Name", value: "Onur Metehan Çakır" },
  { title: "Profession", value: "Veterinarian" },
  { title: "Education", value: "Mehmet Akif Ersoy University, Veterinary Faculty, 2020" },
  { title: "Experience", value: "4+ years of clinical practice" },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      "The experience felt calm, modern, and deeply personal. We finally found a clinic that treats our pet like family.",
    name: "Elif K.",
    pet: "Luna the Golden Retriever",
  },
  {
    quote:
      "The communication was excellent and the care was thoughtful from start to finish. We left feeling reassured.",
    name: "Mert T.",
    pet: "Miso the British Shorthair",
  },
  {
    quote:
      "It is rare to find a clinic that balances medical precision with such warmth and clarity. Our experience felt premium in every way.",
    name: "Deniz A.",
    pet: "Beyaz the Maine Coon",
  },
];

export const blogPosts: BlogPost[] = [
  {
    title: "How preventive medicine extends your pet’s healthiest years",
    category: "Wellness",
    excerpt: "Discover why regular care and tailored plans make a measurable difference in longevity and comfort.",
    date: "June 24, 2026",
  },
  {
    title: "What to expect during a premium veterinary consultation",
    category: "Clinic Experience",
    excerpt: "A clear look at how thoughtful diagnostics, communication, and planning shape a better visit.",
    date: "May 14, 2026",
  },
  {
    title: "Signs your pet may need a deeper medical evaluation",
    category: "Pet Health",
    excerpt: "Learn which subtle changes deserve attention and how timely care can improve outcomes.",
    date: "April 6, 2026",
  },
];

export const faqs: FAQItem[] = [
  {
    question: "Do you offer same-week appointments?",
    answer: "Yes. We prioritize timely access for routine wellness visits and urgent clinical concerns whenever possible.",
  },
  {
    question: "Can you support advanced diagnostics?",
    answer: "Absolutely. We offer modern in-house testing and imaging to support fast, accurate medical decisions.",
  },
  {
    question: "Do you provide guidance after treatment?",
    answer: "Yes. We provide clear post-treatment instructions, follow-up recommendations, and communication support.",
  },
];

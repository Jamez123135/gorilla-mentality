import type { Testimonial } from "@/app/components/TestimonialCard";

export const navLinks = [
  { href: "/starter-pack", label: "Free Starter Pack", variant: "secondary" },
  { href: "/feedback", label: "Feedback", variant: "secondary" },
  { href: "/coaching", label: "Coaching", variant: "primary" },
] as const;

export const socialLinks = [
  { href: "https://www.instagram.com/_gorilla_mentality/", label: "Instagram" },
  { href: "https://www.tiktok.com/@gorilla_mentality0", label: "TikTok" },
  { href: "https://twitter.com", label: "X" },
] as const;

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "ESHUN",
    role: "Client - Fat Loss",
    quote:
      "The plan was simple and I stayed consistent. The structure kept me locked in. I lost about 60 pounds in 15 weeks",
    rating: 5,
    beforeImg: "/testimonials/eshun2.jpg",
    afterImg: "/testimonials/eshun1.jpg",
  },
  {
    id: "2",
    name: "James A",
    role: "Client - Muscle Gain",
    quote:
      "I like that it is not complicated. I just follow the plan and I started growing.",
    rating: 5,
    beforeImg: "/testimonials/jay3.png",
    afterImg: "/testimonials/jay1.png",
  },
  {
    id: "3",
    name: "Daniel O.",
    role: "Intermediate Lifter",
    quote:
      "Clean structure. The workouts make sense and the consistency message is real.",
    rating: 4,
  },
  {
    id: "4",
    name: "Aisha K.",
    role: "Trying to Recomp",
    quote:
      "The guidance feels supportive, not judgmental. That is what I needed.",
    rating: 5,
  },
  {
    id: "5",
    name: "Mike T.",
    role: "Trying to Lose Weight",
    quote: "The focus on discipline and routine helped me stay locked in.",
    rating: 4,
  },
];

export const faqs = [
  {
    q: "Is the Starter Pack really free?",
    a: "Yes. The Starter Pack is free. You can also apply for 1-on-1 coaching if you want something fully customized.",
  },
  {
    q: "Do I need a gym membership?",
    a: "For this version, yes. The Starter Pack is gym-focused. Home plans can come later.",
  },
  {
    q: "Can I use my plan right away?",
    a: "Yes. The Starter Pack generates the routine and meal guide directly on the page, with no sign-up required.",
  },
];

export const processSteps = [
  {
    step: "01",
    title: "Fill the intake",
    body: "Choose your goal, sex, and how many days per week you can train.",
  },
  {
    step: "02",
    title: "Get your routine",
    body: "A gym routine with exercise order, sets, reps, cardio, and meal targets.",
  },
  {
    step: "03",
    title: "Use it today",
    body: "Print it, screenshot it, or start with day one right away.",
  },
];

export const starterFeatures = [
  {
    title: "Gym training routine",
    body: "Manual-style sessions with warmups, sets, reps, cardio, and progression rules.",
  },
  {
    title: "Goal-based meal guide",
    body: "Calories, protein, whole-food options, and sample meals based on the uploaded guide.",
  },
  {
    title: "No sign-up wall",
    body: "Generate the starter routine and use it immediately.",
  },
];

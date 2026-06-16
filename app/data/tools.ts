import { TOOL_CATEGORIES, type ToolCategory } from "../../lib/tool-categories";

export type Tool = {
  name: string;
  slug?: string | null;
  category: ToolCategory;
  description: string;
  website: string;
  logoUrl?: string;
  pricing: "Free" | "Paid" | "Free + Paid";
  platforms: string[];
  featured?: boolean;
  bestFor: string;
  useCases: string[];
  ios?: string;
  android?: string;
};

export const tools: Tool[] = [
  {
    name: "ChatGPT",
    category: "Chatbots",
    description: "Advanced AI assistant for writing, coding, research, productivity, and daily tasks.",
    website: "https://chatgpt.com",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS", "Android"],
    featured: true,
    bestFor: "General AI assistance",
    useCases: ["Writing", "Coding", "Research", "Productivity"],
    ios: "https://apps.apple.com/us/app/chatgpt/id6448311069",
    android: "https://play.google.com/store/apps/details?id=com.openai.chatgpt",
  },
  {
    name: "Claude",
    category: "Chatbots",
    description: "AI assistant focused on long-form reasoning, analysis, writing, and documents.",
    website: "https://claude.ai",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS", "Android"],
    featured: true,
    bestFor: "Long-form reasoning",
    useCases: ["Writing", "Research", "Analysis", "Documents"],
    ios: "https://apps.apple.com/us/app/claude-by-anthropic/id6473753684",
    android: "https://play.google.com/store/apps/details?id=com.anthropic.claude",
  },
  {
    name: "Gemini",
    category: "Chatbots",
    description: "Google AI assistant integrated with search, productivity, and multimodal tools.",
    website: "https://gemini.google.com",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS", "Android"],
    featured: true,
    bestFor: "Google ecosystem",
    useCases: ["Search", "Productivity", "Research", "Planning"],
    ios: "https://apps.apple.com/us/app/google-gemini/id6477489729",
    android: "https://play.google.com/store/apps/details?id=com.google.android.apps.bard",
  },
  {
    name: "Perplexity",
    category: "Education AI",
    description: "AI-powered answer engine with web research and cited answers.",
    website: "https://perplexity.ai",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS", "Android"],
    featured: true,
    bestFor: "Research with sources",
    useCases: ["Search", "Research", "Answers", "Summaries"],
    ios: "https://apps.apple.com/us/app/perplexity-ask-anything/id1668000334",
    android: "https://play.google.com/store/apps/details?id=ai.perplexity.app.android",
  },
  {
    name: "Microsoft Copilot",
    category: "Chatbots",
    description: "Microsoft AI assistant for work, search, writing, images, and productivity.",
    website: "https://copilot.microsoft.com",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS", "Android", "Windows"],
    featured: true,
    bestFor: "Microsoft productivity",
    useCases: ["Work", "Search", "Writing", "Productivity"],
    ios: "https://apps.apple.com/us/app/microsoft-copilot/id6472538445",
    android: "https://play.google.com/store/apps/details?id=com.microsoft.copilot",
  },
  {
    name: "Poe",
    category: "Chatbots",
    description: "Multi-model AI chat platform with access to different AI bots.",
    website: "https://poe.com",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS", "Android"],
    bestFor: "Trying multiple AI models",
    useCases: ["Chatbots", "AI Models", "Writing", "Research"],
    ios: "https://apps.apple.com/us/app/poe-fast-ai-chat/id1640745955",
    android: "https://play.google.com/store/apps/details?id=com.poe.android",
  },
  {
    name: "Character.AI",
    category: "Chatbots",
    description: "AI character chatbot platform for roleplay, entertainment, and conversations.",
    website: "https://character.ai",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS", "Android"],
    bestFor: "Character roleplay",
    useCases: ["Roleplay", "Entertainment", "Chatbots", "Fun"],
    ios: "https://apps.apple.com/us/app/character-ai-chat-ask-create/id1671705818",
    android: "https://play.google.com/store/apps/details?id=ai.character.app",
  },

  {
    name: "Midjourney",
    category: "Image AI",
    description: "Generate high-quality AI artwork, realistic visuals, and creative scenes from prompts.",
    website: "https://midjourney.com",
    pricing: "Paid",
    platforms: ["Web"],
    featured: true,
    bestFor: "High-quality AI art",
    useCases: ["Art", "Design", "Images", "Concept Art"],
  },
  {
    name: "DALL·E",
    category: "Image AI",
    description: "AI image generation and editing from OpenAI through ChatGPT.",
    website: "https://chatgpt.com",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS", "Android"],
    featured: true,
    bestFor: "AI image creation",
    useCases: ["Images", "Design", "Art", "Creativity"],
    ios: "https://apps.apple.com/us/app/chatgpt/id6448311069",
    android: "https://play.google.com/store/apps/details?id=com.openai.chatgpt",
  },
  {
    name: "Leonardo AI",
    category: "Image AI",
    description: "AI image platform for game assets, concept art, graphics, and marketing visuals.",
    website: "https://leonardo.ai",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS", "Android"],
    featured: true,
    bestFor: "Game assets and creative design",
    useCases: ["Design", "Art", "Game Assets", "Graphics"],
    ios: "https://apps.apple.com/us/app/leonardo-ai-image-generator/id1666840694",
    android: "https://play.google.com/store/apps/details?id=ai.leonardo.leonardo",
  },
  {
    name: "Adobe Firefly",
    category: "Image AI",
    description: "Adobe AI image generation tools for creative and commercial design workflows.",
    website: "https://firefly.adobe.com",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "Commercial design",
    useCases: ["Design", "Images", "Marketing", "Creative Work"],
  },
  {
    name: "Canva AI",
    category: "Image AI",
    description: "AI design and image tools inside Canva for graphics, posts, and presentations.",
    website: "https://www.canva.com/ai-image-generator",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS", "Android"],
    bestFor: "Simple design creation",
    useCases: ["Social Media", "Design", "Images", "Marketing"],
    ios: "https://apps.apple.com/us/app/canva-design-photo-video/id897446215",
    android: "https://play.google.com/store/apps/details?id=com.canva.editor",
  },
  {
    name: "Ideogram",
    category: "Image AI",
    description: "AI image generator strong for posters, logos, typography, and visual design.",
    website: "https://ideogram.ai",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "Typography images",
    useCases: ["Posters", "Typography", "Design", "Branding"],
  },
  {
    name: "NightCafe",
    category: "Image AI",
    description: "AI art generator and creative community for producing AI artwork.",
    website: "https://creator.nightcafe.studio",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "Creative AI art",
    useCases: ["Art", "Creative Images", "Community", "Design"],
  },

  {
    name: "Runway",
    category: "Video AI",
    description: "AI video generation and editing platform for creators and studios.",
    website: "https://runwayml.com",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS"],
    featured: true,
    bestFor: "AI video creation",
    useCases: ["Video Generation", "Editing", "Creative Content"],
    ios: "https://apps.apple.com/us/app/runwayml/id1665024375",
  },
  {
    name: "Pika",
    category: "Video AI",
    description: "AI video tool for turning prompts and images into animated videos.",
    website: "https://pika.art",
    pricing: "Free + Paid",
    platforms: ["Web"],
    featured: true,
    bestFor: "Prompt-to-video creation",
    useCases: ["Video", "Animation", "Creative Content"],
  },
  {
    name: "Kling AI",
    category: "Video AI",
    description: "AI video generator for cinematic text-to-video and image-to-video creation.",
    website: "https://klingai.com",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "Cinematic AI videos",
    useCases: ["Video Generation", "Cinematic Video", "Image to Video"],
  },
  {
    name: "CapCut",
    category: "Video AI",
    description: "Popular AI-powered video editing platform for creators and short-form videos.",
    website: "https://capcut.com",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS", "Android", "Desktop"],
    featured: true,
    bestFor: "Short-form editing",
    useCases: ["TikTok", "Video", "Editing", "Captions"],
    ios: "https://apps.apple.com/us/app/capcut/id1500855883",
    android: "https://play.google.com/store/apps/details?id=com.lemon.lvoverseas",
  },
  {
    name: "Synthesia",
    category: "Video AI",
    description: "AI avatar video generator for business, training, and marketing videos.",
    website: "https://www.synthesia.io",
    pricing: "Paid",
    platforms: ["Web"],
    bestFor: "AI avatar videos",
    useCases: ["Training", "Marketing", "Avatar Videos", "Business"],
  },
  {
    name: "HeyGen",
    category: "Video AI",
    description: "AI video platform for avatars, dubbing, translation, and business videos.",
    website: "https://www.heygen.com",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "Avatar and marketing videos",
    useCases: ["Avatars", "Dubbing", "Sales", "Marketing"],
  },

  {
    name: "ElevenLabs",
    category: "Voice AI",
    description: "Realistic AI voice generation, voice cloning, narration, and dubbing platform.",
    website: "https://elevenlabs.io",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS", "Android"],
    featured: true,
    bestFor: "Realistic AI voices",
    useCases: ["Voiceovers", "Audio", "AI Voices", "Dubbing"],
    ios: "https://apps.apple.com/us/app/elevenlabs-reader-ai-audio/id6479373050",
    android: "https://play.google.com/store/apps/details?id=io.elevenlabs.readerapp",
  },
  {
    name: "Murf AI",
    category: "Voice AI",
    description: "AI voiceover generator for videos, ads, presentations, and learning content.",
    website: "https://murf.ai",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "Voiceovers",
    useCases: ["Voiceover", "Ads", "Videos", "Presentations"],
  },
  {
    name: "PlayHT",
    category: "Voice AI",
    description: "AI text-to-speech and voice generation platform for creators and businesses.",
    website: "https://play.ht",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "Text-to-speech",
    useCases: ["Text to Speech", "Voice", "Audio", "Narration"],
  },

  {
    name: "Suno",
    category: "Voice AI",
    description: "Generate full AI songs with vocals and instrumentals from text prompts.",
    website: "https://suno.com",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS", "Android"],
    featured: true,
    bestFor: "AI music creation",
    useCases: ["Music", "Songs", "Audio", "Vocals"],
    ios: "https://apps.apple.com/us/app/suno-ai-music/id6480136315",
    android: "https://play.google.com/store/apps/details?id=com.suno.android",
  },
  {
    name: "Udio",
    category: "Voice AI",
    description: "AI music generator for songs, vocals, instrumentals, and creative audio.",
    website: "https://udio.com",
    pricing: "Free + Paid",
    platforms: ["Web"],
    featured: true,
    bestFor: "Song generation",
    useCases: ["Music", "Vocals", "Songs", "Instrumentals"],
  },
  {
    name: "Soundraw",
    category: "Voice AI",
    description: "AI music generator for royalty-friendly background music and creator content.",
    website: "https://soundraw.io",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "Background music",
    useCases: ["Music", "Content Creation", "Background Audio"],
  },

  {
    name: "GitHub Copilot",
    category: "Coding",
    description: "AI coding assistant integrated with popular IDEs for code completion and help.",
    website: "https://github.com/features/copilot",
    pricing: "Paid",
    platforms: ["Desktop"],
    featured: true,
    bestFor: "Programming",
    useCases: ["Coding", "Development", "Automation", "Code Help"],
  },
  {
    name: "Cursor",
    category: "Coding",
    description: "AI-powered code editor built for developers and software projects.",
    website: "https://cursor.com",
    pricing: "Free + Paid",
    platforms: ["Desktop"],
    featured: true,
    bestFor: "AI coding editor",
    useCases: ["Coding", "Debugging", "Code Review", "Development"],
  },
  {
    name: "Replit AI",
    category: "Coding",
    description: "AI coding assistant inside Replit for building apps in the browser.",
    website: "https://replit.com/ai",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "Browser-based coding",
    useCases: ["Coding", "Learning", "Development", "Apps"],
  },
  {
    name: "Codeium",
    category: "Coding",
    description: "AI coding assistant for code completion, search, and developer productivity.",
    website: "https://codeium.com",
    pricing: "Free + Paid",
    platforms: ["Desktop"],
    bestFor: "Code completion",
    useCases: ["Coding", "Autocomplete", "Development", "Productivity"],
  },
  {
    name: "Tabnine",
    category: "Coding",
    description: "AI code completion assistant for developers and engineering teams.",
    website: "https://www.tabnine.com",
    pricing: "Free + Paid",
    platforms: ["Desktop"],
    bestFor: "Team coding",
    useCases: ["Coding", "Autocomplete", "Teams", "Development"],
  },

  {
    name: "Grammarly",
    category: "Writing",
    description: "AI writing assistant for grammar, tone, clarity, and rewriting.",
    website: "https://www.grammarly.com",
    pricing: "Free + Paid",
    platforms: ["Web", "Desktop", "iOS", "Android"],
    featured: true,
    bestFor: "Writing polish",
    useCases: ["Writing", "Grammar", "Emails", "Editing"],
    ios: "https://apps.apple.com/us/app/grammarly-ai-writing-keyboard/id1158877342",
    android: "https://play.google.com/store/apps/details?id=com.grammarly.android.keyboard",
  },
  {
    name: "Jasper",
    category: "Writing",
    description: "AI writing platform for blogs, ads, emails, brand voice, and marketing teams.",
    website: "https://www.jasper.ai",
    pricing: "Paid",
    platforms: ["Web"],
    bestFor: "Marketing copy",
    useCases: ["Blogs", "Ads", "Marketing", "Emails"],
  },
  {
    name: "Copy.ai",
    category: "Writing",
    description: "AI writing and marketing content generator for sales and content teams.",
    website: "https://www.copy.ai",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "Sales and marketing content",
    useCases: ["Marketing", "Sales", "Writing", "Content"],
  },
  {
    name: "Writesonic",
    category: "Writing",
    description: "AI writing platform for blogs, ads, SEO copy, and marketing content.",
    website: "https://writesonic.com",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "SEO writing",
    useCases: ["Blogs", "SEO", "Ads", "Marketing"],
  },
  {
    name: "QuillBot",
    category: "Writing",
    description: "AI paraphrasing, grammar, citation, and writing improvement tool.",
    website: "https://quillbot.com",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "Paraphrasing",
    useCases: ["Writing", "Paraphrasing", "Grammar", "Students"],
  },

  {
    name: "Notion AI",
    category: "Productivity",
    description: "AI assistant integrated into Notion for writing, notes, and productivity.",
    website: "https://notion.so",
    pricing: "Free + Paid",
    platforms: ["Web", "Desktop", "iOS", "Android"],
    featured: true,
    bestFor: "Workspace productivity",
    useCases: ["Notes", "Writing", "Organization", "Summaries"],
    ios: "https://apps.apple.com/us/app/notion-notes-docs-tasks/id1232780281",
    android: "https://play.google.com/store/apps/details?id=notion.id",
  },
  {
    name: "Otter.ai",
    category: "Productivity",
    description: "AI meeting notes, transcription, summaries, and conversation intelligence.",
    website: "https://otter.ai",
    pricing: "Free + Paid",
    platforms: ["Web", "iOS", "Android"],
    bestFor: "Meeting notes",
    useCases: ["Meetings", "Transcription", "Summaries", "Notes"],
    ios: "https://apps.apple.com/us/app/otter-transcribe-voice-notes/id1276437113",
    android: "https://play.google.com/store/apps/details?id=com.aisense.otter",
  },
  {
    name: "Gamma",
    category: "Productivity",
    description: "AI presentation and document builder for decks, pages, and ideas.",
    website: "https://gamma.app",
    pricing: "Free + Paid",
    platforms: ["Web"],
    featured: true,
    bestFor: "AI presentations",
    useCases: ["Presentations", "Docs", "Slides", "Business"],
  },
  {
    name: "Beautiful.ai",
    category: "Productivity",
    description: "AI-powered presentation design platform for professional slide decks.",
    website: "https://www.beautiful.ai",
    pricing: "Paid",
    platforms: ["Web"],
    bestFor: "Presentation design",
    useCases: ["Slides", "Presentations", "Business", "Design"],
  },
  {
    name: "Tome",
    category: "Productivity",
    description: "AI storytelling and presentation tool for creating visual narratives.",
    website: "https://tome.app",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "Story-driven presentations",
    useCases: ["Presentations", "Storytelling", "Docs", "Business"],
  },

  {
    name: "Zapier AI",
    category: "AI Agents",
    description: "AI automation for workflows, app integrations, and business processes.",
    website: "https://zapier.com/ai",
    pricing: "Free + Paid",
    platforms: ["Web"],
    featured: true,
    bestFor: "App automation",
    useCases: ["Automation", "Workflows", "Business Tasks", "Integrations"],
  },
  {
    name: "Make",
    category: "AI Agents",
    description: "Visual workflow automation platform for connecting apps and processes.",
    website: "https://www.make.com",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "Visual automations",
    useCases: ["Automation", "Workflows", "Apps", "Business"],
  },
  {
    name: "n8n",
    category: "AI Agents",
    description: "Workflow automation platform with AI agent support and self-hosting options.",
    website: "https://n8n.io",
    pricing: "Free + Paid",
    platforms: ["Web", "Self-hosted"],
    bestFor: "Advanced automations",
    useCases: ["Automation", "AI Agents", "Workflows", "Integrations"],
  },
  {
    name: "Lindy",
    category: "AI Agents",
    description: "AI agents for automating business tasks, communications, and workflows.",
    website: "https://www.lindy.ai",
    pricing: "Paid",
    platforms: ["Web"],
    bestFor: "AI business agents",
    useCases: ["Agents", "Automation", "Email", "Business"],
  },
  {
    name: "Gumloop",
    category: "AI Agents",
    description: "AI workflow builder for automating business tasks with no-code agents.",
    website: "https://www.gumloop.com",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "No-code AI workflows",
    useCases: ["Automation", "Agents", "Workflows", "Business"],
  },

  {
    name: "Framer AI",
    category: "Design AI",
    description: "AI-powered website builder for creating polished websites and landing pages.",
    website: "https://www.framer.com/ai",
    pricing: "Free + Paid",
    platforms: ["Web"],
    featured: true,
    bestFor: "AI website design",
    useCases: ["Websites", "Landing Pages", "Design", "Startups"],
  },
  {
    name: "Durable",
    category: "Design AI",
    description: "AI website builder for small businesses, services, and entrepreneurs.",
    website: "https://durable.co",
    pricing: "Free + Paid",
    platforms: ["Web"],
    bestFor: "Small business websites",
    useCases: ["Websites", "Business", "Landing Pages", "Marketing"],
  },
  {
    name: "10Web",
    category: "Design AI",
    description: "AI website builder and WordPress automation platform.",
    website: "https://10web.io",
    pricing: "Paid",
    platforms: ["Web"],
    bestFor: "AI WordPress websites",
    useCases: ["WordPress", "Websites", "Hosting", "Business"],
  },
];

export const categories = TOOL_CATEGORIES.filter((category) =>
  tools.some((tool) => tool.category === category),
);

export const slugify = (text: string) =>
  text.toLowerCase().replaceAll(" ", "-");

export const toolSlug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("·", "")
    .replaceAll(" ", "-");

export const findToolBySlug = (slug: string) =>
  tools.find((tool) => toolSlug(tool.name) === slug);

export const getIcon = (category: string) => {
  switch (category) {
    case "Chatbots":
      return "🤖";
    case "Image AI":
      return "🎨";
    case "Video AI":
      return "🎬";
    case "Voice AI":
      return "🎤";
    case "Coding":
      return "💻";
    case "Writing":
      return "✍️";
    case "Business":
      return "🏢";
    case "Productivity":
      return "📈";
    case "Education AI":
      return "🎓";
    case "Marketing AI":
      return "📣";
    case "SEO AI":
      return "🔎";
    case "Design AI":
      return "✨";
    case "AI Agents":
      return "⚙️";
    default:
      return "✨";
  }
};

export const getLogoUrl = (website: string) => {
  try {
    const domain = new URL(website).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return "https://www.google.com/favicon.ico";
  }
};

export const getToolRating = (name: string) => {
  const base = 4.4;
  const score = name.length % 5;

  return Number((base + score * 0.1).toFixed(1));
};

export const getReviewCount = (name: string) => {
  return name.length * 137;
};

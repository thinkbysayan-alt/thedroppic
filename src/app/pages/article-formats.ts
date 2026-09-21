import { renderArticlePage, type ArticleBlock, type ArticleMeta } from '../article';

export const ARTICLE_FORMATS_META: ArticleMeta = {
  route: 'article-formats',
  category: 'Image Basics',
  title: 'Which Image Format Should You Use? A Practical Guide',
  excerpt: 'JPG, PNG, WebP, AVIF, TIFF or HEIC? Learn which image format suits photos, graphics, websites and print.',
  readTime: '7 min',
  accent: 'accent-blue',
};

const BLOCKS: ArticleBlock[] = [
  {
    type: 'p',
    text: "With so many image formats available today, it can be difficult to know which one to choose. The good news is that you don't need to understand every technical detail to make the right decision. This guide breaks down the most common image formats and explains when to use each one.",
  },
  { type: 'h2', text: 'Quick answer' },
  { type: 'p', text: 'If you just need a simple rule:' },
  {
    type: 'table',
    headers: ['Format', 'Best for'],
    rows: [
      ['JPG', 'Photos and everyday images'],
      ['PNG', 'Transparency, logos, and graphics'],
      ['WebP', 'Websites and general web use'],
      ['AVIF', 'Modern websites where file size matters'],
      ['TIFF', 'Professional, high-quality image workflows'],
      ['HEIC', 'Photos from Apple devices and compatible ecosystems'],
    ],
  },
  {
    type: 'p',
    text: 'There isn’t one format that is best for every situation. Your choice depends on image type, transparency, quality, file size, and compatibility.',
  },
  { type: 'h2', text: '1. JPG: best for photographs and everyday images' },
  {
    type: 'p',
    text: 'JPG, also known as JPEG, is one of the most widely supported image formats. It is particularly well suited to photographs because it can store complex images with lots of colors while keeping the resulting file relatively small.',
  },
  {
    type: 'p',
    text: 'JPG uses lossy compression, meaning some image information is discarded when the image is compressed. At reasonable quality levels, the difference can be difficult to notice, while the reduction in file size can be substantial.',
  },
  {
    type: 'ul',
    items: ['Photographs', 'Personal photos', 'Product photography', 'Blog images', 'Social media images', 'Website images', 'Images where smaller file size is important'],
  },
  {
    type: 'p',
    text: "One limitation: JPG doesn't support transparency. If you need an image with a transparent background, another format such as PNG or WebP may be more appropriate.",
  },
  { type: 'callout', text: 'Simple rule: Photo → JPG' },
  { type: 'h2', text: '2. PNG: best for transparency and graphics' },
  {
    type: 'p',
    text: 'PNG is a popular choice for graphics that need sharp edges or transparent areas. Unlike JPG, PNG supports transparency, making it particularly useful for logos, icons, illustrations, and graphics that need to be placed over different backgrounds. PNG also uses lossless compression, meaning the image data is preserved rather than intentionally discarded during compression.',
  },
  { type: 'ul', items: ['Logos', 'Icons', 'Illustrations', 'Screenshots', 'Graphics with text', 'Transparent images', 'Images with sharp edges'] },
  {
    type: 'p',
    text: 'One limitation: PNG files can be considerably larger than JPG files, especially when used for detailed photographs.',
  },
  { type: 'callout', text: 'Simple rule: Transparency or graphics → PNG' },
  { type: 'h2', text: '3. WebP: best for modern web use' },
  {
    type: 'p',
    text: 'WebP was developed as a modern image format designed to provide efficient compression while supporting features such as transparency. It can be useful when you want good visual quality without unnecessarily large image files. For websites, smaller image files can help reduce the amount of data that needs to be transferred to visitors.',
  },
  { type: 'ul', items: ['Websites', 'Online stores', 'Blog images', 'Digital content', 'Product images', 'Images where file size matters'] },
  {
    type: 'p',
    text: 'WebP can support both lossy and lossless compression, giving it flexibility across different types of images. One limitation: although WebP is widely supported today, you may still encounter workflows, applications, or older systems that expect more traditional formats.',
  },
  { type: 'callout', text: 'Simple rule: Modern website → WebP' },
  { type: 'h2', text: '4. AVIF: best for efficient modern image delivery' },
  {
    type: 'p',
    text: 'AVIF is a newer image format based on the AV1 image format. One of its major advantages is its ability to provide highly efficient compression while maintaining good image quality. This can make AVIF particularly interesting for websites and applications where reducing image transfer size is important.',
  },
  { type: 'ul', items: ['Modern websites', 'Performance-focused web projects', 'High-quality web images', 'Images where efficient compression is important'] },
  {
    type: 'p',
    text: "One limitation: AVIF isn't as universally supported across older software and workflows as JPG or PNG. If compatibility with a wide range of applications is your priority, JPG or PNG may still be more convenient.",
  },
  { type: 'callout', text: 'Simple rule: Modern web + efficient compression → AVIF' },
  { type: 'h2', text: '5. TIFF: best for professional image workflows' },
  {
    type: 'p',
    text: 'TIFF is commonly associated with high-quality imaging and professional workflows. It can store images with substantial detail and is often used where preserving image information is more important than keeping files small. TIFF is commonly encountered in areas such as photography, scanning, publishing, printing, and professional image processing.',
  },
  { type: 'ul', items: ['Professional photography', 'Scanned documents', 'Print workflows', 'Archiving', 'High-quality image processing', 'Professional design workflows'] },
  {
    type: 'p',
    text: 'One limitation: TIFF files can be very large compared with formats designed specifically for web delivery. That makes TIFF generally unsuitable when your primary goal is a small, fast-loading web image.',
  },
  { type: 'callout', text: 'Simple rule: Professional/high-quality workflow → TIFF' },
  { type: 'h2', text: '6. HEIC: best for photos in Apple-focused workflows' },
  {
    type: 'p',
    text: "HEIC is an image container commonly associated with Apple's modern photo ecosystem. It can store high-quality photographs efficiently, which helps reduce storage requirements compared with some traditional formats. You may encounter HEIC files when transferring photographs from iPhones, iPads, or other Apple devices.",
  },
  { type: 'ul', items: ['Photos captured on Apple devices', 'Personal photo libraries', 'Apple-focused workflows', 'Efficient photo storage'] },
  {
    type: 'p',
    text: "One limitation: HEIC can cause compatibility issues when you move images between different devices, applications, websites, or older systems. If someone can't open your HEIC file, converting it to JPG or PNG may solve the problem.",
  },
  { type: 'callout', text: 'Simple rule: Apple photo → HEIC' },
  { type: 'h2', text: 'JPG vs PNG vs WebP vs AVIF vs TIFF vs HEIC' },
  {
    type: 'table',
    headers: ['Format', 'Compression', 'Transparency', 'Typical strength'],
    rows: [
      ['JPG', 'Lossy', 'No', 'Photos and small files'],
      ['PNG', 'Lossless', 'Yes', 'Graphics and transparency'],
      ['WebP', 'Lossy / Lossless', 'Yes', 'Modern web use'],
      ['AVIF', 'Lossy / Lossless', 'Yes', 'Efficient modern web images'],
      ['TIFF', 'Flexible', 'Yes', 'Professional workflows'],
      ['HEIC', 'Efficient', 'Supported in format', 'Device photography'],
    ],
  },
  { type: 'h2', text: 'So, which format should you actually use?' },
  { type: 'p', text: "The answer depends on what you're doing." },
  { type: 'h3', text: "You're uploading a photograph" },
  { type: 'p', text: 'JPG is a safe and widely compatible choice.' },
  { type: 'h3', text: 'You need a transparent background' },
  { type: 'p', text: 'Choose PNG or WebP, depending on where the image will be used.' },
  { type: 'h3', text: "You're building a website" },
  { type: 'p', text: 'WebP is a practical modern choice, while AVIF can be useful when your workflow and compatibility requirements support it.' },
  { type: 'h3', text: "You're preparing images for professional editing or printing" },
  { type: 'p', text: 'TIFF may be more appropriate when preserving image information is important.' },
  { type: 'h3', text: 'You have photos from an iPhone' },
  { type: 'p', text: 'Keeping them as HEIC can make sense within compatible ecosystems. If you need broader compatibility, consider converting them to JPG.' },
  { type: 'h2', text: "Don't choose based on file size alone" },
  {
    type: 'p',
    text: "It's tempting to think that the smallest file is automatically the best file. It isn't. A good image format should balance quality, file size, compatibility, and features. For example, a tiny JPG might be unsuitable for a logo that needs transparency. Similarly, a large TIFF may be unnecessary for a simple website thumbnail. The right format is the one that fits the purpose of the image.",
  },
  { type: 'h2', text: 'Common mistakes to avoid' },
  { type: 'h3', text: 'Using JPG when you need transparency' },
  { type: 'p', text: "JPG doesn't support transparent backgrounds. Use a format that does, such as PNG or WebP." },
  { type: 'h3', text: 'Using PNG for every photograph' },
  { type: 'p', text: "PNG can be excellent for graphics, but it isn't always the most efficient choice for photographs." },
  { type: 'h3', text: 'Uploading huge images to websites' },
  { type: 'p', text: 'A high-resolution image may look great but can be unnecessarily large for its intended display size.' },
  { type: 'h3', text: 'Converting images repeatedly' },
  { type: 'p', text: 'Repeated lossy conversions can gradually reduce image quality. When possible, keep an original version and create optimized copies from it.' },
  { type: 'h3', text: 'Choosing a format without checking compatibility' },
  { type: 'p', text: "A technically efficient format isn't useful if the application or person receiving it can't work with the file." },
  { type: 'h2', text: 'A simple decision guide' },
  { type: 'p', text: "When you're unsure, ask yourself these questions:" },
  {
    type: 'ul',
    items: [
      'Is it a photograph? → JPG',
      'Does it need transparency? → PNG or WebP',
      'Is it primarily for a modern website? → WebP or AVIF',
      'Is it for professional image processing or printing? → TIFF',
      'Is it an Apple device photo? → HEIC',
      'Do you need maximum compatibility? → JPG or PNG',
    ],
  },
  { type: 'h2', text: 'Need to convert your image?' },
  {
    type: 'p',
    text: "Sometimes you already have the right image, just in the wrong format. That's where an image converter can help. With thedroppic, you can convert images between supported formats directly in your browser, making it easier to prepare files for websites, design projects, sharing, and everyday use.",
  },
  { type: 'flow', steps: ['Choose your image', 'Select a format', 'Convert', 'Download'] },
  { type: 'tool-links', routes: ['convert'] },
  { type: 'h2', text: 'Key takeaways' },
  {
    type: 'ul',
    items: [
      'JPG is a practical choice for photographs.',
      'PNG is useful for transparency and graphics.',
      'WebP is well suited to modern web content.',
      'AVIF can provide highly efficient image compression for compatible modern workflows.',
      'TIFF is commonly used for professional, high-quality workflows.',
      'HEIC is commonly used for photographs in Apple ecosystems.',
      'The best format depends on how the image will be used, not simply which format is technically newest.',
    ],
  },
  {
    type: 'callout',
    text: 'When in doubt, think about the purpose first, then choose the format that gives you the right balance of quality, size, features, and compatibility.',
  },
];

export function renderArticleFormatsPage(): HTMLElement {
  return renderArticlePage(ARTICLE_FORMATS_META, BLOCKS);
}

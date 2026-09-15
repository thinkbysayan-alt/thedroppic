import { renderArticlePage, type ArticleBlock, type ArticleMeta } from '../article';

/** Small cover graphic — a simplified browser window with a "processed locally" badge, echoing the About page's illustration language without duplicating it. */
function renderThumbnail(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'article-thumb article-thumb--browser';
  el.innerHTML = `
    <div class="article-thumb__window">
      <span class="article-thumb__dot"></span>
      <span class="article-thumb__dot"></span>
      <span class="article-thumb__dot"></span>
    </div>
    <svg class="article-thumb__icon" viewBox="0 0 24 24" fill="none" stroke="#2563ff" stroke-width="1.75" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="m7 15 3-4 2.5 3L15 11l4 5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  `;
  return el;
}

export const ARTICLE_BROWSER_META: ArticleMeta = {
  route: 'article-browser-processing',
  category: 'Behind the Tool',
  title: 'How Browser-Based Image Processing Works',
  excerpt:
    'What actually happens when you convert, optimize, or remove the background from an image without uploading it to a server? Here’s how browser-based image processing works.',
  readTime: '8 min',
  accent: 'accent-mint',
  thumbnail: renderThumbnail,
};

const BLOCKS: ArticleBlock[] = [
  {
    type: 'p',
    text: 'For years, many online image tools have followed a simple model: upload your image, let a remote server process it, and download the result. Browser-based processing takes a different approach. Instead of automatically sending your image to a server, the processing can happen locally in your browser. This can make image tools faster, more private, and more convenient for everyday tasks.',
  },
  { type: 'h2', text: 'Quick answer' },
  {
    type: 'p',
    text: 'Browser-based image processing means an image is processed directly on your device through your web browser instead of necessarily being sent to a remote server. When you select an image, your browser can read the file, process it using technologies available on the device, generate the result, and make that result available for download.',
  },
  { type: 'flow', steps: ['Select image', 'Browser reads file', 'Processing happens locally', 'Result is created', 'Download'] },
  { type: 'p', text: 'No traditional upload is required for processing that is designed to run locally.' },
  { type: 'h2', text: '“Browser-based” — what does that actually mean?' },
  {
    type: 'p',
    text: "A web browser is more than a tool for viewing websites. Modern browsers can perform increasingly sophisticated tasks using your computer or phone's processing resources — including working with files, manipulating images, running calculations, and even executing machine-learning models. When an image tool is designed for local processing, the browser becomes the environment where that work happens.",
  },
  { type: 'h3', text: 'Instead of this' },
  { type: 'flow', steps: ['Your device', 'Upload', 'Remote server', 'Processing', 'Download'] },
  { type: 'h3', text: 'The workflow can look like this' },
  { type: 'flow', steps: ['Your device', 'Browser', 'Processing', 'Result'] },
  {
    type: 'p',
    text: "The difference is important because the original image doesn't need to leave the device for that particular operation.",
  },
  { type: 'h2', text: 'What happens when you select an image?' },
  {
    type: 'p',
    text: 'Say you select a JPG image from your computer. The browser receives access to the file through the normal file-selection interface. The website can then read the image data and work with it inside the browser. Depending on the tool, the browser may:',
  },
  {
    type: 'ul',
    items: [
      'Read the image file.',
      'Decode the image into usable image data.',
      'Process or transform the image.',
      'Apply the requested operation.',
      'Generate a new image file.',
      'Make the resulting file available for download.',
    ],
  },
  { type: 'p', text: 'The entire process can happen without uploading the original image to a remote service.' },
  { type: 'h2', text: 'Your browser can process more than you think' },
  {
    type: 'p',
    text: 'Modern browsers provide APIs and technologies that allow websites to perform much more advanced work than simple page rendering. For image applications, this can include:',
  },
  {
    type: 'ul',
    items: [
      'Reading local image files',
      'Resizing images',
      'Converting image formats',
      'Compressing images',
      'Manipulating pixels',
      'Creating new image files',
      'Running computationally intensive operations',
      'Running certain machine-learning models',
    ],
  },
  {
    type: 'p',
    text: "Technologies such as Web Workers, WebAssembly, WebGPU, and browser graphics APIs can help developers move demanding processing tasks from a traditional server environment into the user's device.",
  },
  { type: 'h2', text: 'How image conversion works in the browser' },
  { type: 'p', text: 'Image conversion is a good example of local processing. Imagine you want to convert a JPG into PNG. The browser can:' },
  { type: 'h3', text: '1. Read the JPG' },
  { type: 'p', text: "The image file is loaded into the browser's memory." },
  { type: 'h3', text: '2. Decode the image' },
  { type: 'p', text: 'The browser converts the compressed JPG data into image information that can be processed.' },
  { type: 'h3', text: '3. Create the new image' },
  { type: 'p', text: 'The image data is prepared for the target format.' },
  { type: 'h3', text: '4. Encode it' },
  { type: 'p', text: 'The browser creates a new PNG file from the processed image.' },
  { type: 'h3', text: '5. Download the result' },
  { type: 'p', text: 'The resulting file can then be saved directly to your device.' },
  { type: 'p', text: "The original file doesn't have to travel to a remote server for this workflow." },
  { type: 'h2', text: 'How image compression works locally' },
  {
    type: 'p',
    text: 'Compression follows a similar process. Suppose you have a 4 MB photograph and want a smaller version. The browser can load the image, process it at the requested quality or dimensions, and generate a new compressed file. The result might be significantly smaller than the original. The exact reduction depends on factors such as:',
  },
  { type: 'ul', items: ['Original image dimensions', 'Original format', 'Image content', 'Compression method', 'Selected quality', 'Target format'] },
  { type: 'p', text: "That's why two images of the same dimensions can have very different file sizes." },
  { type: 'h2', text: 'What about background removal?' },
  {
    type: 'p',
    text: 'Background removal can be more computationally demanding. Simple image conversion and compression can often be handled with traditional browser image-processing capabilities. AI-powered background removal is different — a machine-learning model can analyze an image and estimate which parts belong to the main subject and which parts belong to the background. When that model is designed to run locally, the browser can load the model and perform the inference on the user’s device.',
  },
  { type: 'flow', steps: ['Image', 'AI model', 'Subject detection', 'Foreground mask', 'Clean cutout'] },
  { type: 'p', text: 'The resulting mask can then be used to create an image with a transparent background.' },
  { type: 'h2', text: 'Why does browser-based processing matter?' },
  { type: 'h3', text: 'Privacy' },
  {
    type: 'p',
    text: "If an image doesn't need to be uploaded to a server, the original file can remain on your device during processing. This can be particularly useful when working with personal photos, private documents, product images, or other files you don't want to unnecessarily send elsewhere. However, privacy ultimately depends on how a particular website is built — a website can still communicate with servers for other purposes, so users should always check the site's privacy information.",
  },
  { type: 'h3', text: 'Speed' },
  {
    type: 'p',
    text: 'Local processing can eliminate the need to upload a large image before processing begins. For some tasks, this can make the experience feel much faster — there is no need to wait for a remote server to receive the file, process it, and send the result back. Actual performance still depends on the device, browser, image size, and complexity of the operation.',
  },
  { type: 'h3', text: 'No file upload required' },
  { type: 'p', text: 'One of the biggest differences is the workflow itself. Instead of:' },
  { type: 'flow', steps: ['Upload', 'Wait', 'Process', 'Download'] },
  { type: 'p', text: 'you can have:' },
  { type: 'flow', steps: ['Select', 'Process', 'Download'] },
  { type: 'p', text: 'This is particularly convenient when working with multiple images.' },
  { type: 'h2', text: "Does browser-based mean the internet isn't used?" },
  {
    type: 'p',
    text: "Not necessarily — this is an important distinction. A website still needs to load in your browser, which normally requires an internet connection. But loading the website and uploading your image are two different things. A locally processed image can remain on your device even though the web application itself was downloaded from the internet. Some applications can also cache resources and support offline functionality, but that depends on how the application is designed.",
  },
  { type: 'h2', text: 'What are the limitations?' },
  {
    type: 'p',
    text: "Browser-based processing isn't magic. Your device is doing the work, so there are some limitations.",
  },
  { type: 'h3', text: 'Device performance' },
  { type: 'p', text: 'A powerful computer can generally handle demanding processing more comfortably than an older or lower-powered device.' },
  { type: 'h3', text: 'Memory usage' },
  { type: 'p', text: 'Large images can require significant amounts of memory while being decoded and processed.' },
  { type: 'h3', text: 'Processing time' },
  { type: 'p', text: 'Complex operations, particularly AI-based processing, can take longer depending on your hardware.' },
  { type: 'h3', text: 'Browser capabilities' },
  { type: 'p', text: 'Different browsers and devices support different technologies and hardware acceleration capabilities. For these reasons, a well-designed browser-based image tool should handle different devices gracefully and provide appropriate loading and error states.' },
  { type: 'h2', text: 'Browser processing vs. server processing' },
  {
    type: 'table',
    headers: ['', 'Browser-Based', 'Server-Based'],
    rows: [
      ['Where processing happens', 'Your device', 'Remote server'],
      ['Image upload', 'May not be required', 'Usually required'],
      ['Internet connection', 'Usually needed to load the app', 'Usually required'],
      ['Device resources', 'Uses your device', 'Uses server resources'],
      ['Privacy considerations', 'Image can remain local', 'Image is transmitted to server'],
      ['Performance', 'Depends on your hardware', 'Depends on network + server'],
      ['Large/complex tasks', 'Can be demanding', 'Can use powerful server hardware'],
    ],
  },
  {
    type: 'p',
    text: 'Neither approach is automatically suitable for every application. The best approach depends on the type of processing, device capabilities, privacy requirements, and technical design.',
  },
  { type: 'h2', text: 'How thedroppic uses browser-based processing' },
  {
    type: 'p',
    text: "thedroppic is built around the idea that many everyday image tasks don't need to start with uploading your files to a remote server. thedroppic provides three core image tools:",
  },
  { type: 'h3', text: 'Convert Images' },
  { type: 'p', text: 'Convert supported image formats directly in your browser.' },
  { type: 'h3', text: 'Remove Backgrounds' },
  { type: 'p', text: 'Process images to create background-free results using browser-based processing.' },
  { type: 'h3', text: 'Optimize Images' },
  { type: 'p', text: 'Reduce image file sizes directly on your device.' },
  { type: 'tool-links', routes: ['convert', 'remove-background', 'optimize'] },
  { type: 'p', text: 'The goal is simple: give you useful image tools while keeping your files under your control.' },
  { type: 'h2', text: 'Is browser-based processing secure?' },
  {
    type: 'p',
    text: "“Browser-based” and “secure” aren't automatically the same thing. A website's security depends on many factors, including its code, dependencies, browser security, and how it handles data. However, local image processing can reduce one important part of the data journey: the need to transmit the original image to a remote processing server. For privacy-conscious users, that's a meaningful distinction. It's always worth checking how an image tool handles your files before using it for sensitive content.",
  },
  { type: 'h2', text: 'The future of browser-based image tools' },
  {
    type: 'p',
    text: "Browsers continue to gain access to more powerful capabilities. As web technologies improve, increasingly sophisticated applications can run directly on users' devices — opening the door to tools that once required dedicated desktop applications or powerful backend infrastructure. Image conversion, optimization, editing, and AI-assisted processing are all areas where local browser computation can provide useful alternatives to traditional upload-and-process workflows.",
  },
  { type: 'h2', text: 'A simpler way to think about it' },
  {
    type: 'p',
    text: "You don't need to understand WebAssembly, WebGPU, machine-learning inference, or image codecs to use browser-based image processing. Think of it this way: your browser becomes the workspace. You provide the image. Your device does the processing. The browser creates the result. You download the finished file.",
  },
  { type: 'h2', text: 'Key takeaways' },
  {
    type: 'ul',
    items: [
      'Browser-based image processing allows many image tasks to happen directly on your device.',
      "Your original image doesn't necessarily need to be uploaded to a remote server.",
      'Modern browsers can handle image conversion, compression, manipulation, and certain AI workloads.',
      'Local processing can offer privacy and eliminate upload/download delays for certain workflows.',
      'Performance depends on your device, browser, image size, and the complexity of the operation.',
      "“Browser-based” doesn't automatically mean a website is completely offline or completely private — implementation matters.",
      'thedroppic is designed around keeping everyday image processing simple and browser-based.',
    ],
  },
  { type: 'callout', text: 'Your images. Your device. Your control.' },
  { type: 'tool-links', routes: ['convert', 'remove-background', 'optimize'] },
];

export function renderArticleBrowserProcessingPage(): HTMLElement {
  return renderArticlePage(ARTICLE_BROWSER_META, BLOCKS);
}

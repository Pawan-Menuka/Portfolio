import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

// Raw HTML stays disabled. Sanitization also constrains any generated markup.
export default function Markdown({ children }) {
  if (typeof children !== 'string' || !children.trim()) return null;
  return <div className="markdown"><ReactMarkdown skipHtml rehypePlugins={[rehypeSanitize]} components={{
    h1: ({ children }) => <h2>{children}</h2>,
    img: ({ alt }) => <span>{alt || ''}</span>,
  }}>{children}</ReactMarkdown></div>;
}

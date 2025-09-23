import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  testId?: string;
}

export function ExpandableText({ 
  text, 
  maxLines = 4, 
  className = "", 
  testId = "expandable-text" 
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Split text into lines based on line breaks or estimated line length
  const lines = text.split('\n');
  const shouldTruncate = lines.length > maxLines || text.length > 400; // Rough estimate for 4 lines
  
  const displayText = isExpanded ? text : lines.slice(0, maxLines).join('\n');
  const isTextTruncated = !isExpanded && shouldTruncate;

  return (
    <div className={className}>
      <p 
        className={`text-muted-foreground leading-relaxed ${isTextTruncated ? 'line-clamp-4' : ''}`}
        style={{
          display: isTextTruncated ? '-webkit-box' : 'block',
          WebkitLineClamp: isTextTruncated ? maxLines : 'unset',
          WebkitBoxOrient: 'vertical' as const,
          overflow: isTextTruncated ? 'hidden' : 'visible'
        }}
        data-testid={testId}
      >
        {displayText}
      </p>
      
      {shouldTruncate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 p-0 h-auto text-primary hover:text-primary/80 font-medium"
          data-testid={`${testId}-toggle`}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              View Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              View More
            </>
          )}
        </Button>
      )}
    </div>
  );
}
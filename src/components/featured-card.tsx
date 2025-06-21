"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import Link from "next/link";
import React, { useState } from "react";

interface FeaturedCardProps {
  logoUrl: string;
  altText: string;
  description: string;
  href?: string;
}

export const FeaturedCard = ({
  logoUrl,
  altText,
  description,
  href,
}: FeaturedCardProps) => {
  // We'll use hover state to control the motion animation for the tooltip.
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={href || "#"} className="block">
      <Card className="flex items-center gap-4 p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Avatar className="border size-12 bg-muted-background dark:bg-foreground">
                <AvatarImage
                  src={logoUrl}
                  alt={altText}
                  className="object-contain"
                />
                <AvatarFallback>{altText[0]}</AvatarFallback>
              </Avatar>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                height: isHovered ? "auto" : 0,
              }}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-xs sm:text-sm"
            >
              {description}
            </motion.div>
          </TooltipContent>
        </Tooltip>
      </Card>
    </Link>
  );
};

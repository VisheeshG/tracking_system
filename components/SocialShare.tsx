"use client";

import { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Mail,
} from "lucide-react";

interface SocialShareProps {
  projectName: string;
  projectDescription?: string;
  projectUrl: string;
  className?: string;
}

export function SocialShare({
  projectName,
  projectDescription,
  projectUrl,
  className = "",
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareText = `Check out my project "${projectName}"${
    projectDescription ? ` - ${projectDescription}` : ""
  }`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(projectUrl);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    email: `mailto:?subject=${encodeURIComponent(
      `Check out my project: ${projectName}`
    )}&body=${encodedText}%0A%0A${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: projectName,
          text: projectDescription || "",
          url: projectUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      setShowShareMenu(true);
    }
  };

  const handleSocialShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleNativeShare}
        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
      >
        <Share2 className="w-4 h-4" />
        <span>Share Project</span>
      </button>

      {showShareMenu && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Share Project</h3>
            <button
              onClick={() => setShowShareMenu(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>

          {/* Copy Link */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg">
              <input
                type="text"
                value={projectUrl}
                readOnly
                className="flex-1 bg-transparent text-sm text-slate-600 outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-1 px-2 py-1 bg-white hover:bg-slate-50 rounded text-sm transition"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Media Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSocialShare("twitter")}
              className="flex items-center space-x-2 p-3 hover:bg-blue-50 rounded-lg transition text-left"
            >
              <Twitter className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">Twitter</span>
            </button>

            <button
              onClick={() => handleSocialShare("facebook")}
              className="flex items-center space-x-2 p-3 hover:bg-blue-50 rounded-lg transition text-left"
            >
              <Facebook className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Facebook</span>
            </button>

            <button
              onClick={() => handleSocialShare("linkedin")}
              className="flex items-center space-x-2 p-3 hover:bg-blue-50 rounded-lg transition text-left"
            >
              <Linkedin className="w-5 h-5 text-blue-700" />
              <span className="text-sm font-medium">LinkedIn</span>
            </button>

            <button
              onClick={() => handleSocialShare("whatsapp")}
              className="flex items-center space-x-2 p-3 hover:bg-green-50 rounded-lg transition text-left"
            >
              <MessageCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">WhatsApp</span>
            </button>

            <button
              onClick={() => handleSocialShare("telegram")}
              className="flex items-center space-x-2 p-3 hover:bg-blue-50 rounded-lg transition text-left"
            >
              <MessageCircle className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">Telegram</span>
            </button>

            <button
              onClick={() => handleSocialShare("email")}
              className="flex items-center space-x-2 p-3 hover:bg-slate-50 rounded-lg transition text-left"
            >
              <Mail className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium">Email</span>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop for mobile */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  );
}

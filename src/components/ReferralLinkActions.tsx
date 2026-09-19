"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

interface ReferralLinkActionsProps {
  promoCode: string;
}

export default function ReferralLinkActions({ promoCode }: ReferralLinkActionsProps) {
  const [copied, setCopied] = useState(false);

  const referralLink = `https://wa.me/13024809919?text=Bonjour%20Suura%20${promoCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback pour les navigateurs sans support clipboard
      const textarea = document.createElement("textarea");
      textarea.value = referralLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Suura",
          text: `Recharge ton crédit ou souscris à un pass en 2 minutes sur Suura ! Utilise mon lien :`,
          url: referralLink,
        });
      } catch {
        // Partage annulé par l'utilisateur, rien à faire
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-50 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100"
      >
        {copied ? (
          <>
            <Check size={14} className="text-green-600" />
            <span className="text-green-600">Copié !</span>
          </>
        ) : (
          <>
            <Copy size={14} />
            Copier le lien
          </>
        )}
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
      >
        <Share2 size={14} />
        Partager
      </button>
    </div>
  );
}

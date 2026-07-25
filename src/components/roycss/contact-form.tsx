"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  MessageSquare,
  User,
  Tag,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Status = "idle" | "submitting" | "success" | "error";

const SUBJECTS = [
  { value: "general", label: "General Inquiry" },
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "suggestion", label: "Suggestion" },
  { value: "partnership", label: "Partnership / Enterprise" },
  { value: "feedback", label: "Feedback" },
] as const;

export function ContactForm({ open, onOpenChange }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string>("general");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      // Small delay so the close animation doesn't show reset
      const t = setTimeout(() => {
        if (status === "success" || status === "error") {
          setName("");
          setEmail("");
          setSubject("general");
          setMessage("");
          setStatus("idle");
          setErrorMsg("");
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open, status]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (status === "submitting") return;

      setStatus("submitting");
      setErrorMsg("");

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            subject:
              SUBJECTS.find((s) => s.value === subject)?.label ??
              "General Inquiry",
            message: message.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(
            data.error || "Failed to send message. Please try again.",
          );
        }

        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        );
      }
    },
    [name, email, subject, message, status],
  );

  const isSubmitting = status === "submitting";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto p-0"
      >
        <SheetHeader className="p-6 pb-2 text-left">
          <SheetTitle className="flex items-center gap-2 font-display text-xl">
            <Mail className="size-5 text-primary" />
            Get in Touch
          </SheetTitle>
          <SheetDescription>
            Have a question, found a bug, or want to suggest a feature? Drop us
            a message — we read every one.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="flex items-center justify-center size-16 rounded-full bg-emerald-500/15 mb-4">
                  <CheckCircle2 className="size-8 text-emerald-500" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Message sent!
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                  Thanks for reaching out. We&apos;ll get back to you at{" "}
                  <span className="font-medium text-foreground">{email}</span>{" "}
                  as soon as possible.
                </p>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="mt-6 cursor-pointer"
                >
                  Done
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name" className="text-xs font-medium">
                    <User className="size-3 inline mr-1" />
                    Name
                  </Label>
                  <Input
                    id="contact-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    className="h-11"
                    autoComplete="name"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="contact-email"
                    className="text-xs font-medium"
                  >
                    <Mail className="size-3 inline mr-1" />
                    Email
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    required
                    maxLength={160}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="h-11"
                    autoComplete="email"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    <Tag className="size-3 inline mr-1" />
                    Subject
                  </Label>
                  <Select
                    value={subject}
                    onValueChange={setSubject}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-11 w-full cursor-pointer">
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="contact-message"
                    className="text-xs font-medium"
                  >
                    <MessageSquare className="size-3 inline mr-1" />
                    Message
                  </Label>
                  <Textarea
                    id="contact-message"
                    required
                    minLength={10}
                    maxLength={5000}
                    placeholder="Tell us what's on your mind... (min 10 characters)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isSubmitting}
                    className="min-h-[120px] resize-y"
                  />
                  <p className="text-[10px] text-muted-foreground text-right tabular-nums">
                    {message.length}/5000
                  </p>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {status === "error" && errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-600 dark:text-rose-400"
                    >
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Send Message
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  By submitting, you agree to be contacted regarding your
                  inquiry. We never share your email.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}

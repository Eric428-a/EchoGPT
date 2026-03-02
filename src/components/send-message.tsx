import type { FormEvent } from "react";
import { useState, useRef } from "react";
import {
  Image01,
  X,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { TextAreaBase } from "@/components/base/textarea/textarea";
import { cx } from "@/utils/cx";

interface MessageActionTextareaProps {
  onSubmit: (message: string, image?: File) => void;
  className?: string;
  textAreaClassName?: string;
}

export const MessageActionTextarea = ({
  onSubmit,
  className,
  textAreaClassName,
  ...props
}: MessageActionTextareaProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const message = formData.get("message") as string;
    if (message.trim() || selectedImage) {
      onSubmit?.(message, selectedImage || undefined);
      handleReset();
    }
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    formRef.current?.reset();
    handleRemoveImage();
  };

  return (
    <form
      ref={formRef}
      className={cx("relative flex h-max items-center gap-3", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <TextAreaBase
        aria-label="Message"
        placeholder="Message"
        name="message"
        className={cx("h-18 w-full resize-none", textAreaClassName)}
      />

      {selectedImage && imagePreview && (
        <div className="absolute left-3 bottom-14 flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
          <img
            src={imagePreview}
            alt="Selected image"
            className="w-8 h-8 object-cover rounded"
          />
          <ButtonUtility
            icon={X}
            size="xs"
            color="tertiary"
            onClick={handleRemoveImage}
            type="button"
          />
        </div>
      )}

      <div className="absolute right-3.5 bottom-2 flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <ButtonUtility
            icon={Image01}
            size="xs"
            color="tertiary"
            onClick={handleImageSelect}
            type="button"
          />
        </div>

        <Button size="sm" color="link-color" type="submit">
          Send
        </Button>
      </div>
    </form>
  );
};

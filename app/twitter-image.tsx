import {
  createSocialPreviewImage,
  socialPreviewAlt,
  socialPreviewContentType,
  socialPreviewSize,
} from "./_lib/social-preview-image"

export const alt = socialPreviewAlt
export const size = socialPreviewSize
export const contentType = socialPreviewContentType

export default function TwitterImage() {
  return createSocialPreviewImage()
}

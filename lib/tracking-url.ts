export type TrackingUrlInput = {
  baseUrl: string;
  brandSlug?: string | null;
  projectSlug: string;
  shortCode: string;
  includeSubmissionInUrl?: boolean;
  creatorPlaceholder?: string;
  submissionPlaceholder?: string;
};

export function buildTrackingUrlTemplate(input: TrackingUrlInput): string {
  const creator = input.creatorPlaceholder ?? "[creator]";
  const base = input.baseUrl.replace(/\/$/, "");

  if (input.brandSlug) {
    const path = [input.brandSlug, input.projectSlug, input.shortCode, creator];
    if (input.includeSubmissionInUrl) {
      path.push(input.submissionPlaceholder ?? "sub1");
    }
    return `${base}/${path.join("/")}`;
  }

  const path = [input.projectSlug, input.shortCode, creator];
  if (input.includeSubmissionInUrl) {
    path.push(input.submissionPlaceholder ?? "sub1");
  }
  return `${base}/${path.join("/")}`;
}

export function buildTrackingUrlExample(input: TrackingUrlInput): string {
  return buildTrackingUrlTemplate({
    ...input,
    creatorPlaceholder: "johndoe",
    submissionPlaceholder: "sub1",
  });
}

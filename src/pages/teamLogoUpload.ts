export const TEAM_LOGOS_BUCKET = "team-logos";
export const TEAM_LOGO_MAX_BYTES = 5 * 1024 * 1024;

const TEAM_LOGO_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const validateTeamLogoFile = (file: File) => {
  if (!TEAM_LOGO_MIME_EXTENSIONS[file.type]) {
    return "Choose a PNG, JPG, or WebP image for your team photo.";
  }

  if (file.size > TEAM_LOGO_MAX_BYTES) {
    return "Team photos must be 5 MB or smaller.";
  }

  return null;
};

export const getTeamLogoFileExtension = (file: File) => {
  return TEAM_LOGO_MIME_EXTENSIONS[file.type] ?? "jpg";
};

export const getTeamLogoStoragePath = ({
  coachId,
  teamId,
  file,
  timestamp = Date.now(),
}: {
  coachId: string;
  teamId: string;
  file: File;
  timestamp?: number;
}) => {
  return `${coachId}/${teamId}-${timestamp}.${getTeamLogoFileExtension(file)}`;
};

interface TeamSchoolClubDisplayInput {
  profileOrganization?: string | null;
  teamOrganization?: string | null;
  teamSport?: string | null;
}

const clean = (value?: string | null) => value?.trim() || "";

export const getTeamSchoolClubDisplay = ({
  profileOrganization,
  teamOrganization,
  teamSport,
}: TeamSchoolClubDisplayInput) => {
  return clean(profileOrganization) || clean(teamOrganization) || clean(teamSport);
};

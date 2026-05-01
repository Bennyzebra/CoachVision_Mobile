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

export const getTeamSportRecapLabel = (teamSport?: string | null) => {
  const sport = clean(teamSport);
  return sport ? `${sport} team` : "Team";
};

export const getPositionAssignmentLabel = (assignedPositions: number, totalPlayers: number) => {
  return `${assignedPositions} / ${totalPlayers} assigned`;
};

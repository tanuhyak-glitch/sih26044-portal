// Bachelor's degrees only (per SIH26044 scope) with their standard
// duration in years, so the Year dropdown can be constrained per degree
// instead of accepting arbitrary text.
export const DEGREES = [
  { key: "btech", label: "B.Tech / B.E.", years: 4 },
  { key: "bca", label: "BCA", years: 3 },
  { key: "bsc", label: "B.Sc", years: 3 },
  { key: "bcom", label: "B.Com", years: 3 },
  { key: "bba", label: "BBA", years: 3 },
  { key: "ba", label: "BA", years: 3 },
  { key: "bpharm", label: "B.Pharm", years: 4 },
  { key: "other", label: "Other bachelor's degree", years: 4 },
];

export function yearsForDegree(degreeLabel) {
  const match = DEGREES.find((d) => d.label === degreeLabel);
  return match ? match.years : 4;
}

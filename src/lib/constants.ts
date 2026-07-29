export const SERVICE_OPTIONS = [
  "airtime",
  "data",
  "electricity",
  "cable_tv",
  "internet",
  "education",
  "airtime_to_cash",
  "waec",
  "neco",
  "jamb",
] as const;

export const SERVICE_LABELS: Record<string, string> = {
  airtime: "Airtime",
  data: "Data",
  electricity: "Electricity",
  cable_tv: "Cable TV",
  internet: "Internet",
  education: "Education",
  airtime_to_cash: "Airtime to Cash",
  waec: "WAEC",
  neco: "NECO",
  jamb: "JAMB",
};

export const TOKEN_KEY = "techhub_token";

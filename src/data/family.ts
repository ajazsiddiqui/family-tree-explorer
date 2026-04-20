// Edit this file to manage your family tree.
// Each member needs a unique id. Reference parents/spouse by id.

export type Gender = "male" | "female" | "other";

export interface FamilyMember {
  id: string;
  name: string;
  gender: Gender;
  dob?: string; // ISO date YYYY-MM-DD
  dod?: string; // date of death (optional)
  dom?: string; // date of marriage (optional)
  birthPlace?: string;
  occupation?: string;
  bio?: string;
  photo?: string; // URL or emoji
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  alive?: boolean;
}

// Sample family — replace with your own.
export const family: FamilyMember[] = [
  // Generation 1
  {
    id: "g1-grandpa",
    name: "Arthur Sharma",
    gender: "male",
    dob: "1935-04-12",
    dod: "2010-08-03",
    dom: "1958-11-20",
    birthPlace: "Pune, India",
    occupation: "Headmaster",
    bio: "Patriarch of the family. Loved chess and classical music.",
    spouseId: "g1-grandma",
    alive: false,
  },
  {
    id: "g1-grandma",
    name: "Indira Sharma",
    gender: "female",
    dob: "1938-09-25",
    dod: "2018-02-14",
    dom: "1958-11-20",
    birthPlace: "Nagpur, India",
    occupation: "Homemaker & poet",
    bio: "Wrote over 200 poems. Known for her warmth and storytelling.",
    spouseId: "g1-grandpa",
    alive: false,
  },

  // Generation 2 — children of g1
  {
    id: "g2-rajiv",
    name: "Rajiv Sharma",
    gender: "male",
    dob: "1962-06-18",
    dom: "1989-12-04",
    birthPlace: "Pune",
    occupation: "Civil Engineer",
    fatherId: "g1-grandpa",
    motherId: "g1-grandma",
    spouseId: "g2-meera",
    alive: true,
  },
  {
    id: "g2-meera",
    name: "Meera Sharma",
    gender: "female",
    dob: "1965-03-22",
    dom: "1989-12-04",
    birthPlace: "Mumbai",
    occupation: "Pediatrician",
    spouseId: "g2-rajiv",
    alive: true,
  },
  {
    id: "g2-anita",
    name: "Anita Sharma-Iyer",
    gender: "female",
    dob: "1965-11-08",
    dom: "1992-05-17",
    birthPlace: "Pune",
    occupation: "Architect",
    fatherId: "g1-grandpa",
    motherId: "g1-grandma",
    spouseId: "g2-vikram",
    alive: true,
  },
  {
    id: "g2-vikram",
    name: "Vikram Iyer",
    gender: "male",
    dob: "1963-01-30",
    dom: "1992-05-17",
    birthPlace: "Chennai",
    occupation: "Professor of Physics",
    spouseId: "g2-anita",
    alive: true,
  },

  // Generation 3
  {
    id: "g3-arjun",
    name: "Arjun Sharma",
    gender: "male",
    dob: "1991-07-14",
    dom: "2019-02-09",
    birthPlace: "Bengaluru",
    occupation: "Software Engineer",
    fatherId: "g2-rajiv",
    motherId: "g2-meera",
    spouseId: "g3-priya",
    alive: true,
  },
  {
    id: "g3-priya",
    name: "Priya Sharma",
    gender: "female",
    dob: "1992-10-02",
    dom: "2019-02-09",
    birthPlace: "Hyderabad",
    occupation: "Designer",
    spouseId: "g3-arjun",
    alive: true,
  },
  {
    id: "g3-neha",
    name: "Neha Sharma",
    gender: "female",
    dob: "1995-12-19",
    birthPlace: "Bengaluru",
    occupation: "Doctor (Resident)",
    fatherId: "g2-rajiv",
    motherId: "g2-meera",
    alive: true,
  },
  {
    id: "g3-karthik",
    name: "Karthik Iyer",
    gender: "male",
    dob: "1994-04-05",
    birthPlace: "Chennai",
    occupation: "Filmmaker",
    fatherId: "g2-vikram",
    motherId: "g2-anita",
    alive: true,
  },
  {
    id: "g3-divya",
    name: "Divya Iyer",
    gender: "female",
    dob: "1997-08-23",
    birthPlace: "Chennai",
    occupation: "PhD Student",
    fatherId: "g2-vikram",
    motherId: "g2-anita",
    alive: true,
  },

  // Generation 4 — newborns
  {
    id: "g4-aanya",
    name: "Aanya Sharma",
    gender: "female",
    dob: "2021-05-10",
    birthPlace: "Bengaluru",
    occupation: "Future explorer",
    bio: "Loves dinosaurs and dancing.",
    fatherId: "g3-arjun",
    motherId: "g3-priya",
    alive: true,
  },
  {
    id: "g4-vihaan",
    name: "Vihaan Sharma",
    gender: "male",
    dob: "2024-01-22",
    birthPlace: "Bengaluru",
    occupation: "Newborn",
    fatherId: "g3-arjun",
    motherId: "g3-priya",
    alive: true,
  },
];

export const familyName = "The Sharma Family";
export const familyMotto = "Roots that hold, branches that reach.";

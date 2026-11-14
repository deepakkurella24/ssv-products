import type { AdminAddress, AdminCustomer, DeliveryZone } from "./types";

// Mock customers. Most are in Hyderabad; a few elsewhere so zone reporting has data.

export interface SeedCustomer extends AdminCustomer {
  address: Omit<AdminAddress, "id" | "name" | "phone">;
  zone: DeliveryZone;
  weight: number;
}

const hyd = (door_no: string, street: string, pincode: string) => ({
  door_no,
  street,
  city: "Hyderabad",
  state: "Telangana",
  pincode,
});

export const SEED_CUSTOMERS: SeedCustomer[] = [
  {
    id: "c01",
    name: "Lakshmi Reddy",
    phone: "9849012345",
    address: hyd("8-2-293/82", "Road No. 12, Banjara Hills", "500034"),
    zone: "same_city",
    weight: 4,
  },
  {
    id: "c02",
    name: "Mohammed Irfan",
    phone: "9908123456",
    address: hyd("12-2-718", "Nanal Nagar, Tolichowki", "500008"),
    zone: "same_city",
    weight: 3,
  },
  {
    id: "c03",
    name: "Ananya Iyer",
    phone: "9866234567",
    address: hyd("Flat 402, Aparna Towers", "Nanakramguda Road, Gachibowli", "500032"),
    zone: "same_city",
    weight: 3,
  },
  {
    id: "c04",
    name: "Kavya Sharma",
    phone: "9959345678",
    address: hyd("Plot 21", "Kavuri Hills Phase 2, Madhapur", "500081"),
    zone: "same_city",
    weight: 2,
  },
  {
    id: "c05",
    name: "Srinivas Rao",
    phone: "9848456789",
    address: hyd("H.No. 15-31-2M", "KPHB Colony Phase 3, Kukatpally", "500072"),
    zone: "same_city",
    weight: 4,
  },
  {
    id: "c06",
    name: "Priya Nair",
    phone: "9885567890",
    address: hyd("Flat 9B, Cyber Meadows", "Image Gardens Road, Madhapur", "500081"),
    zone: "same_city",
    weight: 3,
  },
  {
    id: "c07",
    name: "Venkat Goud",
    phone: "9912678901",
    address: hyd("3-6-112", "Ramanthapur Main Road, Uppal", "500039"),
    zone: "same_city",
    weight: 2,
  },
  {
    id: "c08",
    name: "Fatima Begum",
    phone: "9963789012",
    address: hyd("10-3-45", "Humayun Nagar, Mehdipatnam", "500028"),
    zone: "same_city",
    weight: 2,
  },
  {
    id: "c09",
    name: "Ravi Teja",
    phone: "9700890123",
    address: hyd("Flat 301, My Home Jewel", "Madinaguda, Miyapur", "500049"),
    zone: "same_city",
    weight: 3,
  },
  {
    id: "c10",
    name: "Haritha Chowdary",
    phone: "9618901234",
    address: hyd("6-3-1192", "Begumpet Main Road", "500016"),
    zone: "same_city",
    weight: 2,
  },
  {
    id: "c11",
    name: "Arjun Menon",
    phone: "9849123987",
    address: hyd("Villa 14, Lanco Hills", "Manikonda", "500089"),
    zone: "same_city",
    weight: 2,
  },
  {
    id: "c12",
    name: "Deepika Rao",
    phone: "9866345219",
    address: hyd("1-8-303", "Sindhi Colony, Secunderabad", "500003"),
    zone: "same_city",
    weight: 3,
  },
  {
    id: "c13",
    name: "Suresh Yadav",
    phone: "9393456120",
    address: hyd("16-11-740", "Moosarambagh, Dilsukhnagar", "500060"),
    zone: "same_city",
    weight: 2,
  },
  {
    id: "c14",
    name: "Padma Rani",
    phone: "9440567231",
    address: hyd("3-4-526", "Barkatpura, Himayatnagar", "500029"),
    zone: "same_city",
    weight: 2,
  },
  {
    id: "c15",
    name: "Naveen Kumar",
    phone: "9989678342",
    address: hyd("Flat 205, Sri Sai Residency", "Kondapur Main Road", "500084"),
    zone: "same_city",
    weight: 3,
  },
  {
    id: "c16",
    name: "Sneha Patil",
    phone: "9701789453",
    address: hyd("2-2-1137", "New Nallakunta", "500044"),
    zone: "same_city",
    weight: 2,
  },
  {
    id: "c17",
    name: "Imran Khan",
    phone: "9848890564",
    address: hyd("9-4-87", "Attapur Ring Road", "500048"),
    zone: "same_city",
    weight: 2,
  },
  {
    id: "c18",
    name: "Divya Pillai",
    phone: "9866901675",
    address: hyd("H.No. 4-7", "Sainikpuri, Secunderabad", "500094"),
    zone: "same_city",
    weight: 2,
  },
  {
    id: "c19",
    name: "Rohit Agarwal",
    phone: "9949321870",
    address: hyd("Flat 1203, Rainbow Vistas", "Moosapet, Kukatpally", "500018"),
    zone: "same_city",
    weight: 2,
  },
  {
    id: "c20",
    name: "Swathi Varma",
    phone: "9652012786",
    address: hyd("8-3-167", "Srinagar Colony, Ameerpet", "500073"),
    zone: "same_city",
    weight: 2,
  },
  {
    id: "c21",
    name: "Sowmya Kulkarni",
    phone: "9849234561",
    address: {
      door_no: "2-5-718",
      street: "Subedari, Hanamkonda",
      city: "Warangal",
      state: "Telangana",
      pincode: "506001",
    },
    zone: "same_state",
    weight: 2,
  },
  {
    id: "c22",
    name: "Ramesh Babu",
    phone: "9440345672",
    address: {
      door_no: "4-1-210",
      street: "Mukarampura",
      city: "Karimnagar",
      state: "Telangana",
      pincode: "505001",
    },
    zone: "same_state",
    weight: 1,
  },
  {
    id: "c23",
    name: "Anitha Goud",
    phone: "9989456783",
    address: {
      door_no: "6-2-45",
      street: "Pragathi Nagar",
      city: "Nizamabad",
      state: "Telangana",
      pincode: "503003",
    },
    zone: "same_state",
    weight: 1,
  },
  {
    id: "c24",
    name: "Karthik Reddy",
    phone: "9845567894",
    address: {
      door_no: "No. 48, 2nd Cross",
      street: "HSR Layout Sector 6",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560102",
    },
    zone: "nearby_states",
    weight: 2,
  },
  {
    id: "c25",
    name: "Bhavana Murthy",
    phone: "9866678905",
    address: {
      door_no: "40-15-9",
      street: "Labbipet",
      city: "Vijayawada",
      state: "Andhra Pradesh",
      pincode: "520010",
    },
    zone: "nearby_states",
    weight: 1,
  },
  {
    id: "c26",
    name: "Aditya Deshmukh",
    phone: "9822789016",
    address: {
      door_no: "Flat 7, Shanti Kunj",
      street: "Kothrud",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411038",
    },
    zone: "nearby_states",
    weight: 1,
  },
  {
    id: "c27",
    name: "Meenakshi Sundaram",
    phone: "9884890127",
    address: {
      door_no: "12, 3rd Street",
      street: "Abhiramapuram",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600018",
    },
    zone: "other_states",
    weight: 1,
  },
  {
    id: "c28",
    name: "Neha Bansal",
    phone: "9811901238",
    address: {
      door_no: "C-214",
      street: "Saket",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110017",
    },
    zone: "other_states",
    weight: 1,
  },
];

export function addressFor(customer: SeedCustomer, id = `${customer.id}-a1`): AdminAddress {
  return { id, name: customer.name, phone: customer.phone, ...customer.address };
}

export function findSeedCustomer(id: string) {
  return SEED_CUSTOMERS.find((c) => c.id === id)!;
}

/** Zone from an address, for orders created from custom requests. */
export function zoneForAddress(address: Pick<AdminAddress, "city" | "state">): DeliveryZone {
  if (
    address.city.trim().toLowerCase() === "hyderabad" ||
    address.city.trim().toLowerCase() === "secunderabad"
  ) {
    return "same_city";
  }
  if (address.state === "Telangana") return "same_state";
  if (
    ["Andhra Pradesh", "Karnataka", "Maharashtra", "Chhattisgarh", "Odisha"].includes(address.state)
  ) {
    return "nearby_states";
  }
  return "other_states";
}

/** Deterministic pseudo-random generator so seed data is stable. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

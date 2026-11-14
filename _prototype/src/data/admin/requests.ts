import { addressFor, findSeedCustomer, rng, SEED_CUSTOMERS, zoneForAddress } from "./customers";
import { ApiError, clone, readDb, simulateRequest, writeDb } from "./db";
import { EXPECTED_DELIVERY_DAYS } from "./orders";
import type {
  AdminAddress,
  AdminCustomRequest,
  AdminOrder,
  RequestStatus,
  StatusEvent,
} from "./types";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Valid next steps. New or Contacted requests may also be closed directly. */
export function nextRequestStatuses(status: RequestStatus): RequestStatus[] {
  switch (status) {
    case "new":
      return ["contacted", "closed"];
    case "contacted":
      return ["confirmed", "closed"];
    case "confirmed":
      return ["closed"];
    default:
      return [];
  }
}

export const REQUEST_STEPS: RequestStatus[] = ["new", "contacted", "confirmed", "closed"];

function events(received: number, path: [RequestStatus, number][]): StatusEvent<RequestStatus>[] {
  return [
    { status: "new", at: new Date(received).toISOString() },
    ...path.map(([status, offset]) => ({ status, at: new Date(received + offset).toISOString() })),
  ];
}

const PRODUCTS_ASKED = [
  "Cold Pressed Sesame Oil",
  "Groundnut Oil",
  "Coconut Oil",
  "Forest Honey",
  "Turmeric Powder",
  "Red Chilli Powder",
  "Dhoop Sticks",
  "Black Sesame Oil",
];

const NEEDS = [
  "For a family function next month. Please share the best price.",
  "Monthly supply for our restaurant if the quality is good.",
  "Gift packs for office colleagues, about 40 people.",
  "For a temple annadanam. Need it delivered in cans.",
  "Bulk order for our apartment community, split into 1 kg packs.",
  "Would like to stock this in our organic store.",
];

export function generateSeedRequests(now: number): AdminCustomRequest[] {
  const c = findSeedCustomer;
  const withAddress = (id: string, extra: AdminAddress[] = []) => {
    const customer = c(id);
    return {
      customer: { id: customer.id, name: customer.name, phone: customer.phone },
      addresses: [addressFor(customer), ...extra],
    };
  };

  const recent: AdminCustomRequest[] = [
    {
      id: "CR-2006",
      product_name: "Forest Honey",
      quantity_kg: 10,
      customisation:
        "Need it in 500 g glass jars for Diwali gifting, about 20 jars. Can you add a small thank-you tag on each jar?",
      ...withAddress("c19"),
      received_at: new Date(now - 40 * MIN).toISOString(),
      status: "new",
      status_history: events(now - 40 * MIN, []),
      admin_notes: "",
      order_id: null,
    },
    {
      id: "CR-2005",
      product_name: "Turmeric Powder",
      quantity_kg: 5,
      customisation: "For a wedding on 22 Nov. Coarse grind preferred, packed in 1 kg pouches.",
      ...withAddress("c10"),
      received_at: new Date(now - 3 * HOUR).toISOString(),
      status: "new",
      status_history: events(now - 3 * HOUR, []),
      admin_notes: "",
      order_id: null,
    },
    {
      id: "CR-2004",
      product_name: "Cold Pressed Sesame Oil",
      quantity_kg: 15,
      customisation:
        "Packed in 5 cans of 3 L each for a temple kitchen. Deliver before Saturday morning.",
      ...withAddress("c04"),
      received_at: new Date(now - 27 * HOUR).toISOString(),
      status: "confirmed",
      status_history: events(now - 27 * HOUR, [
        ["contacted", 2 * HOUR],
        ["confirmed", 22 * HOUR],
      ]),
      admin_notes: "Agreed ₹5,400 including delivery. Advance ₹2,000 received on UPI.",
      order_id: null,
    },
    {
      id: "CR-2003",
      product_name: "Groundnut Oil",
      quantity_kg: 20,
      customisation:
        "For our restaurant in Kukatpally. Would like a monthly supply if the quality is good.",
      ...withAddress("c17", [
        {
          id: "c17-a2",
          name: "Imran Khan (Restaurant)",
          phone: "9848890564",
          door_no: "Shop 4, Sri Krishna Complex",
          street: "KPHB Main Road, Kukatpally",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500072",
        },
      ]),
      received_at: new Date(now - 2 * DAY).toISOString(),
      status: "contacted",
      status_history: events(now - 2 * DAY, [["contacted", 5 * HOUR]]),
      admin_notes: "Called on Friday. Groundnut stock arrives next week. Quoted ₹265 per kg.",
      order_id: null,
    },
    {
      id: "CR-2002",
      product_name: "Black Pepper (Whole)",
      quantity_kg: 2,
      customisation: "Whole pepper for home use, two 1 kg packs.",
      ...withAddress("c18"),
      received_at: new Date(now - 5 * DAY).toISOString(),
      status: "closed",
      status_history: events(now - 5 * DAY, [
        ["contacted", 3 * HOUR],
        ["closed", 26 * HOUR],
      ]),
      admin_notes: "Out of stock this season. Customer informed and will order honey instead.",
      order_id: null,
    },
    {
      id: "CR-2001",
      product_name: "Dhoop Sticks",
      quantity_kg: 3,
      customisation: "Same as my earlier request, please ignore the duplicate.",
      ...withAddress("c11"),
      received_at: new Date(now - 9 * DAY).toISOString(),
      status: "closed",
      status_history: events(now - 9 * DAY, [["closed", 4 * HOUR]]),
      admin_notes: "Duplicate request.",
      order_id: null,
    },
  ];

  // Older requests so the funnel in Analytics has history.
  const r = rng(77);
  const older: AdminCustomRequest[] = Array.from({ length: 12 }, (_, i) => {
    const customer = SEED_CUSTOMERS[Math.floor(r() * 20)];
    const received = now - (11 + i * 4 + Math.floor(r() * 3)) * DAY - Math.floor(r() * 10) * HOUR;
    const outcome = i % 3; // 0: confirmed then closed, 1: contacted then closed, 2: closed from new
    const path: [RequestStatus, number][] =
      outcome === 0
        ? [
            ["contacted", 3 * HOUR],
            ["confirmed", DAY],
            ["closed", 5 * DAY],
          ]
        : outcome === 1
          ? [
              ["contacted", 5 * HOUR],
              ["closed", 2 * DAY],
            ]
          : [["closed", 6 * HOUR]];
    return {
      id: `CR-${2000 - i}`,
      product_name: PRODUCTS_ASKED[Math.floor(r() * PRODUCTS_ASKED.length)],
      quantity_kg: [2, 5, 8, 10, 15, 25][Math.floor(r() * 6)],
      customisation: NEEDS[Math.floor(r() * NEEDS.length)],
      customer: { id: customer.id, name: customer.name, phone: customer.phone },
      addresses: [addressFor(customer)],
      received_at: new Date(received).toISOString(),
      status: "closed",
      status_history: events(received, path),
      admin_notes:
        outcome === 0
          ? "Delivered and paid."
          : outcome === 1
            ? "Price did not work for the customer."
            : "Could not reach the customer.",
      order_id: null,
    };
  });

  return [...recent, ...older];
}

// ---------- API ----------

export async function getCustomRequests(): Promise<AdminCustomRequest[]> {
  await simulateRequest();
  return clone([...readDb().requests].sort((a, b) => b.received_at.localeCompare(a.received_at)));
}

export async function getCustomRequestById(id: string): Promise<AdminCustomRequest | null> {
  await simulateRequest();
  const req = readDb().requests.find((x) => x.id === id);
  return req ? clone(req) : null;
}

function mutateRequest(id: string, fn: (r: AdminCustomRequest) => void) {
  let result: AdminCustomRequest | undefined;
  writeDb((d) => {
    const req = d.requests.find((x) => x.id === id);
    if (!req) throw new ApiError("NOT_FOUND", "This request no longer exists.");
    fn(req);
    result = req;
  });
  return clone(result!);
}

export async function updateCustomRequestStatus(id: string, next: RequestStatus) {
  await simulateRequest();
  const current = readDb().requests.find((x) => x.id === id);
  if (!current) throw new ApiError("NOT_FOUND", "This request no longer exists.");
  if (!nextRequestStatuses(current.status).includes(next)) {
    throw new ApiError("INVALID_TRANSITION", "This request can't move to that step.");
  }
  return mutateRequest(id, (r) => {
    r.status = next;
    r.status_history.push({ status: next, at: new Date().toISOString() });
  });
}

/** Private notes; never exposed to customers. */
export async function saveAdminNotes(id: string, notes: string) {
  await simulateRequest();
  return mutateRequest(id, (r) => {
    r.admin_notes = notes;
  });
}

export async function addCustomerAddress(requestId: string, address: Omit<AdminAddress, "id">) {
  await simulateRequest();
  const created: AdminAddress = { ...address, id: `addr-${Date.now().toString(36)}` };
  mutateRequest(requestId, (r) => {
    r.addresses.push(created);
  });
  return clone(created);
}

/**
 * Creates an order at the agreed price. The agreed price is the payable total;
 * no delivery charge is added.
 */
export async function createOrderFromRequest(
  requestId: string,
  input: { price: number; address_id: string },
): Promise<AdminOrder> {
  await simulateRequest(400);
  const db = readDb();
  const req = db.requests.find((x) => x.id === requestId);
  if (!req) throw new ApiError("NOT_FOUND", "This request no longer exists.");
  if (req.order_id)
    throw new ApiError("ALREADY_CREATED", `Order #${req.order_id} was already created.`);
  if (!(input.price > 0)) throw new ApiError("INVALID", "Enter the agreed price.");
  const address = req.addresses.find((a) => a.id === input.address_id);
  if (!address) throw new ApiError("INVALID", "Choose a delivery address.");

  const product = db.products.find((p) => p.name.toLowerCase() === req.product_name.toLowerCase());
  const number = Math.max(...db.orders.map((o) => o.number)) + 1;
  const now = Date.now();
  const at = new Date(now).toISOString();
  const order: AdminOrder = {
    id: String(number),
    number,
    placed_at: at,
    status: "confirmed",
    status_history: [
      { status: "pending", at },
      { status: "confirmed", at },
    ],
    customer: clone(req.customer),
    address: clone(address),
    items: [
      {
        id: `it-${requestId}`,
        product_id: product?.id ?? null,
        name: req.product_name,
        variant_label: "Custom order",
        image_url: product?.image_url ?? "",
        qty: 1,
        price: input.price,
        weight_kg: req.quantity_kg,
        customisation: req.customisation,
      },
    ],
    total: input.price,
    amount_paid: 0,
    payment_method: "cod",
    expected_delivery: new Date(now + EXPECTED_DELIVERY_DAYS * DAY).toISOString(),
    delivered_at: null,
    delivery_zone: zoneForAddress(address),
    source_request_id: requestId,
  };

  writeDb((d) => {
    d.orders.unshift(order);
    const r = d.requests.find((x) => x.id === requestId)!;
    r.order_id = order.id;
    if (r.status !== "confirmed") {
      r.status = "confirmed";
      r.status_history.push({ status: "confirmed", at });
    }
  });
  return clone(order);
}

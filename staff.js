// ─────────────────────────────────────────────────────────────────────────────
//  staff.js  –  Static staff database
//  Fields: id, name, email, phone (E.164), birthday (MM-DD), department, avatar
//  To add more staff, append objects to the array following the same schema.
// ─────────────────────────────────────────────────────────────────────────────

const staff = [
  {
    id: 1,
    name: "dhana",
    email: "priya.sharma@company.com",
    phone: "+919701415172",          // WhatsApp-registered number (E.164)
    birthday: "05-05",               // MM-DD  (year is ignored)
    department: "Engineering",
    avatar: "dd"
  },
  {
    id: 2,
    name: "Rahul Verma",
    email: "rahul.verma@company.com",
    phone: "+919876543211",
    birthday: "04-25",
    department: "Design",
    avatar: "RV"
  },
  {
    id: 3,
    name: "Anjali Nair",
    email: "anjali.nair@company.com",
    phone: "+919876543212",
    birthday: "05-02",
    department: "Marketing",
    avatar: "AN"
  },
  {
    id: 4,
    name: "Kiran Reddy",
    email: "kiran.reddy@company.com",
    phone: "+919876543213",
    birthday: "04-28",
    department: "HR",
    avatar: "KR"
  },
  {
    id: 5,
    name: "Sanjay Patel",
    email: "sanjay.patel@company.com",
    phone: "+919876543214",
    birthday: "05-01",
    department: "Finance",
    avatar: "SP"
  },
  {
    "id": 6,
    "name": "Meera Krishnan new",
    "email": "meera.krishnan@company.com",
    "phone": "+919876543215",
    "birthday": "05-06",
    "department": "Engineering",
    "avatar": "MK"
  },
  {
    id: 7,
    name: "Arjun Singh",
    email: "arjun.singh@company.com",
    phone: "+919876543216",
    birthday: "06-10",
    department: "Sales",
    avatar: "AS"
  },
  {
    id: 8,
    name: "Deepa Iyer",
    email: "deepa.iyer@company.com",
    phone: "+919876543217",
    birthday: "07-04",
    department: "Product",
    avatar: "DI"
  }
];

module.exports = staff;

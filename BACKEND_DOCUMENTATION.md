# Backend API Documentation

## Base URL
```
https://bisnesgpt.jutateknologi.com
```

## Table of Contents
- [Authentication & User Management](#authentication--user-management)
- [Contact Management](#contact-management)
- [Tag Management](#tag-management)
- [Message Scheduling](#message-scheduling)
- [Company & Bot Management](#company--bot-management)
- [Sync Operations](#sync-operations)
- [Data Structures](#data-structures)

---

## Authentication & User Management

### Get User Configuration
**Endpoint:** `GET /api/user/config`

**Query Parameters:**
- `email` (required): User email address

**Response:**
```json
{
  "company_id": "string",
  "role": "string",
  "name": "string",
  "email": "string"
}
```

**Use Case:** Retrieve user configuration including company ID and role for authorization and context.

---

### Get User Context
**Endpoint:** `GET /api/user-context`

**Query Parameters:**
- `email` (required): User email address

**Response:**
```json
{
  "companyId": "string",
  "role": "string",
  "employees": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "employeeId": "string",
      "phoneNumber": "string"
    }
  ],
  "phoneNames": {
    "0": "Phone 1",
    "1": "Phone 2"
  },
  "apiUrl": "string",
  "stopBot": false,
  "stopBots": {}
}
```

**Use Case:** Fetch comprehensive user context including company data, employees, and phone configurations.

---

### Get User Page Context
**Endpoint:** `GET /api/user-page-context`

**Query Parameters:**
- `email` (required): User email address

**Response:**
```json
{
  "phoneNames": {
    "0": "Phone 1",
    "1": "Phone 2"
  }
}
```

**Use Case:** Get phone names for the user's company to display in phone selection dropdowns.

---

### Get User Company Data
**Endpoint:** `GET /api/user-company-data`

**Query Parameters:**
- `email` (required): User email address

**Response:**
```json
{
  "companyId": "string",
  "accessToken": "string",
  "locationId": "string"
}
```

**Use Case:** Retrieve company-specific data for API integrations and operations.

---

### Get User Data
**Endpoint:** `GET /api/user-data`

**Query Parameters:**
- `email` (required): User email address

**Response:**
```json
{
  "companyId": "string",
  "email": "string",
  "name": "string"
}
```

---

## Contact Management

### Get All Contacts
**Endpoint:** `GET /api/companies/{companyId}/contacts`

**Path Parameters:**
- `companyId` (required): Company identifier

**Query Parameters:**
- `email` (required): User email for authorization

**Response:**
```json
{
  "contacts": [
    {
      "contact_id": "string",
      "contactName": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string",
      "company": "string",
      "tags": ["string"],
      "assignedTo": "string",
      "chat_id": "string",
      "createdAt": "string",
      "customFields": {
        "field_name": "value"
      },
      "branch": "string",
      "vehicleNumber": "string",
      "ic": "string",
      "expiryDate": "string"
    }
  ]
}
```

**Use Case:** Fetch all contacts for a company, with optional filtering based on user role.

---

### Create Contact
**Endpoint:** `POST /api/contacts`

**Request Body:**
```json
{
  "contactName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "address1": "string",
  "companyName": "string",
  "locationId": "string",
  "branch": "string",
  "expiryDate": "string",
  "vehicleNumber": "string",
  "ic": "string",
  "notes": "string",
  "customFields": {
    "field_name": "value"
  },
  "tags": ["string"],
  "company_id": "string"
}
```

**Response:**
```json
{
  "success": true,
  "contact": {
    "contact_id": "string",
    "contactName": "string"
  }
}
```

**Use Case:** Create a new contact in the system.

---

### Bulk Create Contacts
**Endpoint:** `POST /api/contacts/bulk`

**Request Body:**
```json
{
  "contacts": [
    {
      "contactName": "string",
      "phone": "string",
      "email": "string",
      "tags": ["string"],
      "customFields": {}
    }
  ],
  "companyId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "created": 10,
  "updated": 5,
  "failed": 0
}
```

**Use Case:** Import multiple contacts at once, typically from CSV files.

---

### Update Contact
**Endpoint:** `PUT /api/contacts/{contact_id}`

**Path Parameters:**
- `contact_id` (required): Contact identifier

**Request Body:**
```json
{
  "contactName": "string",
  "email": "string",
  "phone": "string",
  "customFields": {},
  "tags": ["string"],
  "notes": "string"
}
```

**Response:**
```json
{
  "success": true,
  "contact": {}
}
```

---

### Delete Contact
**Endpoint:** `DELETE /api/contacts/{contact_id}`

**Query Parameters:**
- `companyId` (required): Company identifier

**Response:**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

---

### Force Delete Contact
**Endpoint:** `DELETE /api/contacts/{contact_id}/force`

**Query Parameters:**
- `companyId` (required): Company identifier

**Response:**
```json
{
  "success": true
}
```

**Use Case:** Force delete a contact even if there are dependencies.

---

### Mass Delete Contacts
**Endpoint:** `POST /api/contacts/mass-delete`

**Request Body:**
```json
{
  "contactIds": ["string"],
  "companyId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "deleted": 10,
  "failed": 0
}
```

---

### Assign Employee to Contact
**Endpoint:** `POST /api/contacts/{companyId}/{contactId}/assign-employee`

**Path Parameters:**
- `companyId` (required): Company identifier
- `contactId` (required): Contact identifier

**Request Body:**
```json
{
  "employeeName": "string"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### Stop Blast for Contact
**Endpoint:** `POST /api/contacts/{companyId}/{contactId}/stop-blast`

**Response:**
```json
{
  "success": true
}
```

**Use Case:** Stop scheduled messages for a specific contact.

---

## Tag Management

### Get All Tags
**Endpoint:** `GET /api/companies/{companyId}/tags`

**Path Parameters:**
- `companyId` (required): Company identifier

**Response:**
```json
{
  "tags": [
    {
      "id": "string",
      "name": "string"
    }
  ]
}
```

---

### Create Tag
**Endpoint:** `POST /api/companies/{companyId}/tags`

**Request Body:**
```json
{
  "name": "string"
}
```

**Response:**
```json
{
  "success": true,
  "tag": {
    "id": "string",
    "name": "string"
  }
}
```

---

### Add Tags to Contact
**Endpoint:** `POST /api/contacts/{companyId}/{contactId}/tags`

**Path Parameters:**
- `companyId` (required): Company identifier
- `contactId` (required): Contact identifier

**Request Body:**
```json
{
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "success": true,
  "tags": ["tag1", "tag2"]
}
```

---

### Remove Tags from Contact
**Endpoint:** `DELETE /api/contacts/{companyId}/{contactId}/tags`

**Request Body:**
```json
{
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "success": true,
  "tags": ["remaining_tag"]
}
```

---

## Message Scheduling

### Schedule Message
**Endpoint:** `POST /api/schedule-message/{companyId}`

**Path Parameters:**
- `companyId` (required): Company identifier

**Request Body:**
```json
{
  "chatIds": ["string"],
  "message": "string",
  "messages": [
    {
      "chatId": "string",
      "message": "string",
      "contactData": {}
    }
  ],
  "batchQuantity": 10,
  "contact_id": ["string"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "documentUrl": "string",
  "fileName": "string",
  "mediaUrl": "string",
  "mimeType": "string",
  "repeatInterval": 0,
  "repeatUnit": "minutes",
  "scheduledTime": "2024-01-01T10:00:00.000Z",
  "status": "scheduled",
  "v2": true,
  "whapiToken": null,
  "phoneIndex": 0,
  "minDelay": 1,
  "maxDelay": 2,
  "activateSleep": false,
  "sleepAfterMessages": 20,
  "sleepDuration": 5,
  "multiple": true,
  "activeHours": {
    "start": "09:00",
    "end": "17:00"
  }
}
```

**Response:**
```json
{
  "success": true,
  "scheduleId": "string"
}
```

**Use Case:** Schedule blast messages to multiple contacts with advanced settings.

**Note:** `activeHours` field is optional for backwards compatibility. If not provided, messages will be sent at any time.

---

### Get Scheduled Messages
**Endpoint:** `GET /api/scheduled-messages`

**Query Parameters:**
- `companyId` (required): Company identifier

**Response:**
```json
{
  "messages": [
    {
      "id": "string",
      "scheduleId": "string",
      "message": "string",
      "scheduledTime": "string",
      "status": "scheduled",
      "batchQuantity": 10,
      "chatIds": ["string"],
      "phoneIndex": 0,
      "activeHours": {
        "start": "09:00",
        "end": "17:00"
      }
    }
  ]
}
```

---

### Update Scheduled Message
**Endpoint:** `PUT /api/schedule-message/{companyId}/{messageId}`

**Path Parameters:**
- `companyId` (required): Company identifier
- `messageId` (required): Scheduled message identifier

**Request Body:**
```json
{
  "message": "string",
  "messages": [],
  "processedMessages": [],
  "documentUrl": "string",
  "fileName": "string",
  "mediaUrl": "string",
  "mimeType": "string",
  "scheduledTime": "string",
  "status": "scheduled",
  "isConsolidated": true
}
```

**Response:**
```json
{
  "success": true
}
```

---

### Delete Scheduled Message
**Endpoint:** `DELETE /api/schedule-message/{companyId}/{messageId}`

**Response:**
```json
{
  "success": true
}
```

---

### Send Text Message
**Endpoint:** `POST /api/v2/messages/text/{companyId}/{phoneIndex}`

**Path Parameters:**
- `companyId` (required): Company identifier
- `phoneIndex` (required): Phone number index

**Request Body:**
```json
{
  "chatId": "string",
  "message": "string"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "string"
}
```

---

### Send Text Message (Legacy)
**Endpoint:** `POST /api/messages/text/{phoneNumber}/{whapiToken}`

**Path Parameters:**
- `phoneNumber` (required): Phone number
- `whapiToken` (required): Whapi authentication token

**Request Body:**
```json
{
  "chatId": "string",
  "message": "string"
}
```

---

## Company & Bot Management

### Get Company Details
**Endpoint:** `GET /api/companies/{companyId}`

**Response:**
```json
{
  "companyId": "string",
  "name": "string",
  "settings": {},
  "whapiToken": "string",
  "v2": true
}
```

---

### Get Bot Status
**Endpoint:** `GET /api/bot-status/{companyId}`

**Response:**
```json
{
  "qrCode": "string",
  "status": "authenticated",
  "phoneInfo": true,
  "phones": [
    {
      "phoneIndex": 0,
      "status": "ready",
      "qrCode": null,
      "phoneInfo": "+1234567890"
    }
  ],
  "companyId": "string",
  "v2": true,
  "trialEndDate": "string",
  "apiUrl": "string",
  "phoneCount": 2
}
```

**Status Values:**
- `ready` / `authenticated`: Phone is connected
- `qr`: QR code needs to be scanned
- `loading`: Connection in progress
- `disconnected`: Not connected

---

## Sync Operations

### Sync Contacts
**Endpoint:** `POST /api/sync-contacts/{companyId}`

**Response:**
```json
{
  "success": true,
  "synced": 100,
  "updated": 50,
  "new": 50
}
```

**Use Case:** Synchronize contacts from external sources (e.g., GHL, WhatsApp).

---

### Sync Contact Names
**Endpoint:** `POST /api/sync-contact-names/{companyId}`

**Response:**
```json
{
  "success": true,
  "updated": 75
}
```

**Use Case:** Update contact names from WhatsApp profile information.

---

## File Upload

### Upload Media
**Endpoint:** `POST /api/upload-media`

**Request:** Multipart form data with file

**Response:**
```json
{
  "url": "string"
}
```

**Use Case:** Upload images, videos, or documents for message attachments.

---

## Data Structures

### Contact Object
```typescript
interface Contact {
  contact_id: string;
  contactName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  company?: string;
  companyName?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  tags?: string[];
  assignedTo?: string;
  locationId?: string;
  chat_id?: string;
  chat_pic_full?: string;
  profileUrl?: string;
  createdAt?: string;
  dateAdded?: string;
  dateUpdated?: string;
  branch?: string;
  vehicleNumber?: string;
  ic?: string;
  expiryDate?: string;
  customFields?: {
    [key: string]: string;
  };
  notes?: string;
  company_id?: string;
}
```

---

### Scheduled Message Object
```typescript
interface ScheduledMessage {
  id?: string;
  scheduleId?: string;
  chatIds: string[];
  message: string;
  messageContent: string;
  messages?: Array<{
    text: string;
    type?: string;
    url?: string;
    mimeType?: string;
    fileName?: string;
    caption?: string;
    isMain?: boolean;
  }>;
  contactId?: string;
  contactIds?: string[];
  multiple?: boolean;
  mediaUrl?: string;
  documentUrl?: string;
  mimeType?: string;
  fileName?: string;
  scheduledTime: string;
  batchQuantity: number;
  repeatInterval: number;
  repeatUnit: "minutes" | "hours" | "days";
  status: "scheduled" | "sent" | "failed";
  createdAt: Timestamp;
  sentAt?: Timestamp;
  error?: string;
  v2?: boolean;
  whapiToken?: string;
  phoneIndex: number;
  minDelay: number;
  maxDelay: number;
  activateSleep: boolean;
  sleepAfterMessages: number | null;
  sleepDuration: number | null;
  activeHours?: {
    start: string; // Format: "HH:MM" (24-hour)
    end: string;   // Format: "HH:MM" (24-hour)
  };
  infiniteLoop: boolean;
  numberOfBatches: number;
  processedMessages?: Array<{
    chatId: string;
    message: string;
    contactData?: {
      contactName: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      vehicleNumber: string;
      branch: string;
      expiryDate: string;
      ic: string;
      customFields?: {
        [key: string]: string;
      };
    };
  }>;
  isConsolidated?: boolean;
}
```

---

### Tag Object
```typescript
interface Tag {
  id: string;
  name: string;
}
```

---

### Employee Object
```typescript
interface Employee {
  id: string;
  name: string;
  role: string;
  phoneNumber: string;
  phoneIndex: number;
  employeeId: string;
  assignedContacts: number;
  quotaLeads: number;
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

API endpoints may be rate-limited. Check response headers:
- `X-RateLimit-Limit`: Maximum requests per time window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when the limit resets

---

## Best Practices

1. **Authentication**: Always include user email in query parameters for user-scoped endpoints
2. **Batch Operations**: Use bulk endpoints for creating/updating multiple records
3. **Pagination**: For large datasets, implement pagination on the frontend
4. **Error Handling**: Always check the `success` field in responses
5. **Time Zones**: All timestamps are in ISO 8601 format and UTC timezone
6. **Active Hours**: When scheduling messages with `activeHours`, ensure times are in 24-hour format (HH:MM)
7. **Backwards Compatibility**: The `activeHours` field is optional in scheduled messages for backwards compatibility

---

## Changelog

### Version 2.0 (Current)
- Added `activeHours` support for scheduled messages with time range restrictions
- Made `activeHours` field optional for backwards compatibility
- Enhanced contact management with custom fields
- Improved tag management with bulk operations
- Added mass delete functionality for contacts

### Version 1.0
- Initial API release
- Basic contact, tag, and message scheduling functionality

# Backend Implementation: Active Hours for Scheduled Messages

## Overview
This document outlines the backend implementation requirements for the Active Hours feature, which allows scheduled messages to be sent only within specified time windows each day.

---

## Feature Requirements

### Summary
Users can now set a time range (e.g., 09:00 - 17:00) when scheduling blast messages. The system should only send messages during this active time window. If the scheduled time falls outside this window, messages should be queued and sent when the active hours begin.

### User Story
**As a** marketing manager  
**I want to** restrict when my blast messages are sent to specific hours of the day  
**So that** I don't disturb customers outside business hours and comply with communication regulations

---

## Database Schema Changes

### Table: `scheduled_messages`

Add new optional columns to support active hours:

```sql
ALTER TABLE scheduled_messages 
ADD COLUMN active_hours_start VARCHAR(5) DEFAULT NULL,
ADD COLUMN active_hours_end VARCHAR(5) DEFAULT NULL;
```

**Column Details:**
- `active_hours_start`: Start time in 24-hour format (HH:MM), e.g., "09:00"
- `active_hours_end`: End time in 24-hour format (HH:MM), e.g., "17:00"
- Both columns are **NULLABLE** for backwards compatibility
- If NULL, messages can be sent at any time (legacy behavior)

### Index Recommendations
```sql
CREATE INDEX idx_active_hours ON scheduled_messages(active_hours_start, active_hours_end);
CREATE INDEX idx_status_scheduled_time ON scheduled_messages(status, scheduled_time);
```

---

## API Changes

### 1. Schedule Message Endpoint
**Endpoint:** `POST /api/schedule-message/{companyId}`

#### Updated Request Body
Add optional `activeHours` object to the existing payload:

```json
{
  "chatIds": ["123456789@c.us"],
  "message": "Hello!",
  "batchQuantity": 10,
  "scheduledTime": "2024-01-01T10:00:00.000Z",
  "phoneIndex": 0,
  // ... other existing fields ...
  
  "activeHours": {
    "start": "09:00",
    "end": "17:00"
  }
}
```

#### Field Specifications

**activeHours** (optional object):
- **start** (string, optional): Start time in "HH:MM" format (24-hour)
  - Valid range: "00:00" to "23:59"
  - Example: "09:00"
- **end** (string, optional): End time in "HH:MM" format (24-hour)
  - Valid range: "00:00" to "23:59"
  - Example: "17:00"

#### Validation Rules

1. **Format Validation**
   ```javascript
   const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
   if (!timeRegex.test(activeHours.start) || !timeRegex.test(activeHours.end)) {
     return { success: false, error: "Invalid time format. Use HH:MM (24-hour)" };
   }
   ```

2. **Logical Validation**
   - If `activeHours` is provided, both `start` and `end` must be present
   - `start` should be before `end` (same day only, no overnight ranges)
   - If `start` >= `end`, return validation error

3. **Backwards Compatibility**
   - If `activeHours` is not provided or is `null`, set both DB columns to NULL
   - Existing scheduled messages without active hours should continue to work

#### Storage Logic
```javascript
const activeHoursStart = req.body.activeHours?.start || null;
const activeHoursEnd = req.body.activeHours?.end || null;

// Store in database
await db.query(
  'INSERT INTO scheduled_messages (..., active_hours_start, active_hours_end) VALUES (..., ?, ?)',
  [...otherValues, activeHoursStart, activeHoursEnd]
);
```

---

### 2. Get Scheduled Messages Endpoint
**Endpoint:** `GET /api/scheduled-messages?companyId={companyId}`

#### Updated Response
Include `activeHours` in the response if set:

```json
{
  "messages": [
    {
      "id": "msg_123",
      "message": "Hello!",
      "scheduledTime": "2024-01-01T10:00:00.000Z",
      "status": "scheduled",
      "activeHours": {
        "start": "09:00",
        "end": "17:00"
      }
      // ... other fields ...
    }
  ]
}
```

#### Query Logic
```javascript
const messages = await db.query('SELECT *, active_hours_start, active_hours_end FROM scheduled_messages WHERE company_id = ?', [companyId]);

// Transform response
return messages.map(msg => ({
  ...msg,
  activeHours: msg.active_hours_start && msg.active_hours_end ? {
    start: msg.active_hours_start,
    end: msg.active_hours_end
  } : null
}));
```

---

### 3. Update Scheduled Message Endpoint
**Endpoint:** `PUT /api/schedule-message/{companyId}/{messageId}`

Support updating `activeHours` in the request body. Follow same validation rules as create endpoint.

---

## Message Processor/Scheduler Logic

### Core Functionality

The scheduler/processor that sends scheduled messages needs to be updated to respect active hours.

### Implementation Requirements

#### 1. Message Retrieval
When fetching messages to process, include active hours data:

```javascript
async function getMessagesToProcess() {
  const currentTime = new Date();
  
  const messages = await db.query(`
    SELECT * FROM scheduled_messages 
    WHERE status = 'scheduled' 
    AND scheduled_time <= ?
    ORDER BY scheduled_time ASC
  `, [currentTime]);
  
  return messages;
}
```

#### 2. Active Hours Check
Before sending each message, verify it's within active hours:

```javascript
function isWithinActiveHours(message) {
  // If no active hours set, always return true (backwards compatible)
  if (!message.active_hours_start || !message.active_hours_end) {
    return true;
  }
  
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM" format
  
  const startTime = message.active_hours_start;
  const endTime = message.active_hours_end;
  
  // Compare times as strings (works for HH:MM format)
  return currentTime >= startTime && currentTime <= endTime;
}
```

#### 3. Updated Processing Logic

```javascript
async function processScheduledMessages() {
  const messages = await getMessagesToProcess();
  
  for (const message of messages) {
    try {
      // Check if within active hours
      if (!isWithinActiveHours(message)) {
        console.log(`Message ${message.id} skipped - outside active hours (${message.active_hours_start} - ${message.active_hours_end})`);
        
        // Option A: Keep status as 'scheduled' and retry later
        // (No action needed, will be picked up in next cycle)
        
        // Option B: Update next retry time (optional optimization)
        // await rescheduleToNextActiveHours(message);
        
        continue;
      }
      
      // Send the message
      await sendMessage(message);
      
      // Update status to 'sent'
      await db.query(
        'UPDATE scheduled_messages SET status = ?, sent_at = ? WHERE id = ?',
        ['sent', new Date(), message.id]
      );
      
    } catch (error) {
      console.error(`Error processing message ${message.id}:`, error);
      await db.query(
        'UPDATE scheduled_messages SET status = ?, error = ? WHERE id = ?',
        ['failed', error.message, message.id]
      );
    }
  }
}
```

#### 4. Optional: Reschedule to Next Active Hours

For better efficiency, you can reschedule messages that fall outside active hours:

```javascript
async function rescheduleToNextActiveHours(message) {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  
  // If current time is before start time today, schedule for start time today
  if (currentTime < message.active_hours_start) {
    const [hours, minutes] = message.active_hours_start.split(':');
    const nextSchedule = new Date(now);
    nextSchedule.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    await db.query(
      'UPDATE scheduled_messages SET scheduled_time = ? WHERE id = ?',
      [nextSchedule, message.id]
    );
  }
  // If current time is after end time today, schedule for start time tomorrow
  else if (currentTime > message.active_hours_end) {
    const [hours, minutes] = message.active_hours_start.split(':');
    const nextSchedule = new Date(now);
    nextSchedule.setDate(nextSchedule.getDate() + 1);
    nextSchedule.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    await db.query(
      'UPDATE scheduled_messages SET scheduled_time = ? WHERE id = ?',
      [nextSchedule, message.id]
    );
  }
}
```

---

## Edge Cases & Considerations

### 1. Timezone Handling
**Issue:** Active hours are sent as local time strings without timezone info.

**Recommendation:**
- Store company timezone in database
- Convert active hours to UTC when checking
- OR: Document that active hours are in company's local timezone

**Implementation Example:**
```javascript
// Assuming company timezone is stored
function isWithinActiveHours(message, companyTimezone) {
  const now = new Date();
  const localTime = now.toLocaleString('en-US', { 
    timeZone: companyTimezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }).slice(-5); // Gets "HH:MM"
  
  return localTime >= message.active_hours_start && 
         localTime <= message.active_hours_end;
}
```

### 2. Long-Running Campaigns
**Issue:** Messages scheduled for multiple days should respect active hours each day.

**Solution:** The current implementation handles this automatically - each time the scheduler runs, it checks current time against active hours.

### 3. Batch Processing
**Issue:** When processing batches, some messages might be sent outside active hours if batch spans across the end time.

**Solution:** Check active hours before each individual message send, not just once per batch.

### 4. Overnight Ranges
**Current Limitation:** System doesn't support ranges like "22:00 - 02:00" (10 PM to 2 AM next day).

**Recommendation:** Document this limitation or implement overnight range support if needed:

```javascript
function isWithinActiveHours(message) {
  if (!message.active_hours_start || !message.active_hours_end) {
    return true;
  }
  
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const startTime = message.active_hours_start;
  const endTime = message.active_hours_end;
  
  // Check if range spans midnight
  if (startTime > endTime) {
    // Overnight range (e.g., 22:00 - 02:00)
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    // Normal range (e.g., 09:00 - 17:00)
    return currentTime >= startTime && currentTime <= endTime;
  }
}
```

---

## Testing Requirements

### Unit Tests

#### 1. Validation Tests
```javascript
describe('Active Hours Validation', () => {
  test('should accept valid time format', () => {
    expect(validateTimeFormat('09:00')).toBe(true);
    expect(validateTimeFormat('23:59')).toBe(true);
  });
  
  test('should reject invalid time format', () => {
    expect(validateTimeFormat('25:00')).toBe(false);
    expect(validateTimeFormat('9:00')).toBe(false); // Should be '09:00'
    expect(validateTimeFormat('09:60')).toBe(false);
  });
  
  test('should reject when start >= end', () => {
    expect(validateActiveHours('17:00', '09:00')).toBe(false);
    expect(validateActiveHours('09:00', '09:00')).toBe(false);
  });
});
```

#### 2. Active Hours Check Tests
```javascript
describe('isWithinActiveHours', () => {
  beforeEach(() => {
    // Mock current time to 10:00
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T10:00:00'));
  });
  
  test('should return true when within active hours', () => {
    const message = {
      active_hours_start: '09:00',
      active_hours_end: '17:00'
    };
    expect(isWithinActiveHours(message)).toBe(true);
  });
  
  test('should return false when before active hours', () => {
    const message = {
      active_hours_start: '11:00',
      active_hours_end: '17:00'
    };
    expect(isWithinActiveHours(message)).toBe(false);
  });
  
  test('should return false when after active hours', () => {
    const message = {
      active_hours_start: '08:00',
      active_hours_end: '09:00'
    };
    expect(isWithinActiveHours(message)).toBe(false);
  });
  
  test('should return true when no active hours set (backwards compatibility)', () => {
    const message = {
      active_hours_start: null,
      active_hours_end: null
    };
    expect(isWithinActiveHours(message)).toBe(true);
  });
});
```

### Integration Tests

#### 1. API Tests
```javascript
describe('POST /api/schedule-message', () => {
  test('should accept message with active hours', async () => {
    const response = await request(app)
      .post('/api/schedule-message/company123')
      .send({
        message: 'Test',
        chatIds: ['123@c.us'],
        scheduledTime: '2024-01-01T10:00:00.000Z',
        activeHours: {
          start: '09:00',
          end: '17:00'
        }
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
  
  test('should accept message without active hours', async () => {
    const response = await request(app)
      .post('/api/schedule-message/company123')
      .send({
        message: 'Test',
        chatIds: ['123@c.us'],
        scheduledTime: '2024-01-01T10:00:00.000Z'
        // No activeHours field
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
  
  test('should reject invalid time format', async () => {
    const response = await request(app)
      .post('/api/schedule-message/company123')
      .send({
        message: 'Test',
        chatIds: ['123@c.us'],
        scheduledTime: '2024-01-01T10:00:00.000Z',
        activeHours: {
          start: '25:00', // Invalid
          end: '17:00'
        }
      });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

#### 2. Scheduler Tests
```javascript
describe('Message Scheduler with Active Hours', () => {
  test('should send message within active hours', async () => {
    // Set current time to 10:00
    jest.setSystemTime(new Date('2024-01-01T10:00:00'));
    
    // Create scheduled message with active hours 09:00-17:00
    const message = await createScheduledMessage({
      active_hours_start: '09:00',
      active_hours_end: '17:00'
    });
    
    // Run scheduler
    await processScheduledMessages();
    
    // Verify message was sent
    const updated = await getScheduledMessage(message.id);
    expect(updated.status).toBe('sent');
  });
  
  test('should skip message outside active hours', async () => {
    // Set current time to 20:00 (8 PM)
    jest.setSystemTime(new Date('2024-01-01T20:00:00'));
    
    // Create scheduled message with active hours 09:00-17:00
    const message = await createScheduledMessage({
      active_hours_start: '09:00',
      active_hours_end: '17:00'
    });
    
    // Run scheduler
    await processScheduledMessages();
    
    // Verify message was NOT sent
    const updated = await getScheduledMessage(message.id);
    expect(updated.status).toBe('scheduled');
    expect(updated.sent_at).toBeNull();
  });
});
```

---

## Monitoring & Logging

### Log Messages
Add appropriate logging for debugging and monitoring:

```javascript
// When skipping due to active hours
logger.info('Message skipped - outside active hours', {
  messageId: message.id,
  currentTime: getCurrentTime(),
  activeHours: `${message.active_hours_start} - ${message.active_hours_end}`,
  scheduledTime: message.scheduled_time
});

// When successfully sent
logger.info('Message sent successfully', {
  messageId: message.id,
  sentAt: new Date(),
  activeHours: message.active_hours_start ? 
    `${message.active_hours_start} - ${message.active_hours_end}` : 
    'None'
});
```

### Metrics to Track
1. Messages skipped due to active hours
2. Messages sent within active hours
3. Average delay between scheduled time and actual send time
4. Messages that failed active hours validation

---

## Migration Plan

### Phase 1: Database Update
1. Add new columns to `scheduled_messages` table
2. Create indexes
3. Verify backwards compatibility with existing records

### Phase 2: API Updates
1. Update schedule message endpoint to accept `activeHours`
2. Update get scheduled messages endpoint to return `activeHours`
3. Deploy API changes
4. Test with new frontend

### Phase 3: Scheduler Updates
1. Update message processor to check active hours
2. Add logging and monitoring
3. Deploy scheduler changes
4. Monitor for 24-48 hours

### Phase 4: Validation
1. Verify existing messages without active hours still work
2. Verify new messages with active hours respect time windows
3. Load test with multiple scheduled messages

---

## Rollback Plan

If issues arise:
1. Revert scheduler changes first (messages will send at any time)
2. If needed, revert API changes
3. Database columns can remain (nullable, no impact)

---

## Documentation Updates

Update the following documentation:
1. API documentation with new `activeHours` field
2. User guide on how to use active hours feature
3. Admin guide on monitoring scheduled messages
4. Database schema documentation

---

## Timeline Estimate

- Database changes: 1 hour
- API updates and testing: 4 hours
- Scheduler logic and testing: 6 hours
- Integration testing: 4 hours
- Documentation: 2 hours
- **Total: ~17 hours (2-3 days)**

---

## Questions for Discussion

1. **Timezone handling**: Should we store company timezone in DB or use system timezone?
2. **Overnight ranges**: Do we need to support time ranges that span midnight?
3. **Retry logic**: Should messages outside active hours be automatically rescheduled?
4. **Notification**: Should users be notified when messages are delayed due to active hours?
5. **Batch behavior**: For batch campaigns, should we pause the entire batch or continue with next batch during active hours?

---

## Contact

For questions or clarifications on this implementation:
- Frontend Developer: [Contact information]
- Backend Team Lead: [Contact information]
- Product Manager: [Contact information]

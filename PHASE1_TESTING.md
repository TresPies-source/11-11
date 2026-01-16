# Phase 1 Manual Testing Guide

## Prerequisites
- Dev server running: `npm run dev`
- Browser open at: http://localhost:3000

## Test 1: Save Workbench Content as Prompt

### Steps:
1. Navigate to http://localhost:3000/workbench
2. Complete onboarding wizard if shown
3. In the editor, type some content:
   ```
   # Test Prompt for Phase 1
   
   This is a test prompt to verify the Knowledge Hub save functionality.
   ```
4. Click the **"Save to Hub"** button in the action bar
5. In the modal that opens:
   - Verify "Prompt" is selected (should be selected by default)
   - Enter Name: `Test Phase 1 Prompt`
   - Enter Description: `A test prompt for Phase 1 verification`
   - Enter Tags: `test, phase1, knowledge-hub`
   - Leave "Make this public" unchecked
6. Click **"Save"**

### Expected Results:
- ✅ Success toast appears: "✅ Saved as Prompt!"
- ✅ Modal closes automatically
- ✅ No errors in browser console

### Verification:
1. Navigate to http://localhost:3000/librarian
2. Look for "Test Phase 1 Prompt" in the prompts list
3. Click on it to verify content matches what you typed

## Test 2: Save Workbench Content as Seed

### Steps:
1. Return to http://localhost:3000/workbench
2. Clear the editor and type new content:
   ```
   Remember to always use client-side PGlite calls, never API routes for database operations.
   ```
3. Click **"Save to Hub"**
4. In the modal:
   - Select **"Seed"** option
   - Enter Name: `Test Phase 1 Seed`
   - Enter Description: `A test seed for Phase 1 verification`
   - Select Type: `Principle`
   - Select Status: `New`
   - Why Matters: `Critical architectural pattern`
   - Revisit When: `When implementing new features`
   - Enter Tags: `test, architecture, pglite`
5. Click **"Save"**

### Expected Results:
- ✅ Success toast appears: "✅ Saved as Seed!"
- ✅ Modal closes automatically
- ✅ No errors in browser console

### Verification:
1. Navigate to http://localhost:3000/seeds
2. Look for "Test Phase 1 Seed" in the seeds list
3. Click on it to verify content and metadata

## Test 3: Open Prompt in Workbench

### Steps:
1. Go to http://localhost:3000/librarian
2. Find "Test Phase 1 Prompt" card
3. Look for **"Open in Workbench"** button
4. Click it

### Expected Results:
- ✅ Navigate to /workbench
- ✅ New tab opens with the prompt content
- ✅ Tab title shows "Test Phase 1 Prompt"
- ✅ Content matches the saved prompt

## Test 4: Open Seed in Workbench

### Steps:
1. Go to http://localhost:3000/seeds
2. Find "Test Phase 1 Seed" card
3. Look for **"Open in Workbench"** button
4. Click it

### Expected Results:
- ✅ Navigate to /workbench
- ✅ New tab opens with the seed content
- ✅ Tab title shows "Test Phase 1 Seed"
- ✅ Content matches the saved seed

## Test 5: Verify Knowledge Links in Database

### Steps:
1. Open browser DevTools (F12)
2. Go to **Application** tab (or **Storage** in Firefox)
3. Find **IndexedDB** in the left sidebar
4. Expand **idb://11-11-db**
5. Look for **knowledge_links** table
6. Click on it to view entries

### Expected Results:
- ✅ Should see 2 entries (if both Test 3 and Test 4 were completed)
- ✅ Each entry should have:
  - `source_type`: "file"
  - `source_id`: (some file ID)
  - `target_type`: "prompt" or "seed"
  - `target_id`: (UUID of the saved artifact)
  - `relationship`: "extracted_from"
  - `user_id`: "dev@11-11.dev"
  - `metadata`: JSON with timestamp, description, tags

### SQL Query (Optional - Advanced):
Open browser console and run:
```javascript
// Get the PGlite instance
const db = await import('/lib/pglite/client.ts').then(m => m.getDB());

// Query knowledge links
const result = await db.query(`
  SELECT * FROM knowledge_links 
  ORDER BY created_at DESC 
  LIMIT 10
`);

console.table(result.rows);
```

## Test 6: Form Validation

### Steps:
1. Go to http://localhost:3000/workbench
2. Click **"Save to Hub"**
3. Try to save with empty name

### Expected Results:
- ✅ Error message: "Name is required"
- ✅ Form does not submit

### Steps:
1. Enter name with only 2 characters: `ab`
2. Try to save

### Expected Results:
- ✅ Error message: "Name must be at least 3 characters"
- ✅ Form does not submit

## Test 7: Seed-Specific Fields

### Steps:
1. Open Save modal
2. Select **"Seed"** type

### Expected Results:
- ✅ Additional fields appear:
  - Type dropdown
  - Status dropdown
  - Why Matters textarea
  - Revisit When textarea
- ✅ Fields are properly labeled

### Steps:
1. Try to save without selecting Type

### Expected Results:
- ✅ Form uses default type: "principle"
- ✅ Form uses default status: "new"
- ✅ Save succeeds

## Console Logs to Look For

When saving, you should see these logs in browser console:

```
[SAVE_ARTIFACT_MODAL] Creating prompt: Test Phase 1 Prompt
[KNOWLEDGE_LINKS] Inserted link {id}: file:{fileId} -> prompt:{promptId}
[SAVE_ARTIFACT_MODAL] Created prompt {promptId}
[SAVE_ARTIFACT_MODAL] Created knowledge link {linkId}
```

## Known Issues / Limitations

- ✅ All operations are client-side (no API routes)
- ✅ Data is stored in browser IndexedDB
- ✅ Data is not synced across devices
- ✅ Clearing browser data will delete all saved artifacts

## Troubleshooting

### Modal doesn't open
- Check browser console for errors
- Verify ActionBar has active tab
- Refresh page and try again

### Save fails silently
- Open browser console
- Look for PGlite initialization errors
- Check IndexedDB permissions in browser

### "Open in Workbench" doesn't work
- Verify artifact was saved successfully
- Check browser console for navigation errors
- Verify workbench store is initialized

### No knowledge links created
- Verify sourceFileId is passed to modal
- Check console logs for insertKnowledgeLink calls
- Query IndexedDB directly to confirm

## Success Criteria Summary

Phase 1 is complete when:
- ✅ Can save Workbench content as Prompt
- ✅ Can save Workbench content as Seed
- ✅ Can open Prompt in Workbench
- ✅ Can open Seed in Workbench
- ✅ Knowledge links are created in database
- ✅ Form validation works correctly
- ✅ No console errors during normal operation

---

**Testing Date:** _________________  
**Tester:** _________________  
**Pass/Fail:** _________________  
**Notes:** _________________

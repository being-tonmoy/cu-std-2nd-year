# Admin Setup Guide - Faculty & Department Configuration

## Overview

The Admin Setup page allows administrators to import and manage faculty and department information for the student information form. This data is stored in Firestore and automatically fetched by the form.

## Accessing the Admin Setup Page

**URL**: `http://localhost:3000/admin/setup`

## How to Use

### Step 1: Copy Faculty Data

Open the provided `depts.txt` file and copy all the faculty and department data:

```
Faculty of Arts and Humanities (fah):
    Bangla
    English
    History
    ... (and all other departments)

Faculty of Science (fsc):
    Physics
    Chemistry
    ... (and all other departments)

... (and so on for all faculties)
```

### Step 2: Paste Data into the Form

1. Navigate to `/admin/setup`
2. Click on the large text area labeled "Faculty & Department Data"
3. Paste the copied data

### Step 3: Submit

Click the "Save Faculty Data" button. The system will:
- Parse the faculty names and aliases (text in parentheses)
- Extract all departments for each faculty
- Create server timestamps (createdAt) for each entry
- Save everything to Firestore

### Step 4: Verify

After submission, you'll see a success message showing:
- Number of faculties saved
- Total number of departments saved

The saved data will display below showing:
- Faculty name and alias
- Creation timestamp
- List of all departments

## Data Format Requirements

The data must follow this exact format:

```
Faculty of [Full Name] ([alias]):
    Department 1
    Department 2
    Department Name 3
    ...

Faculty of [Another Name] ([alias2]):
    Department A
    Department B
    ...
```

**Important**:
- Each faculty name must be in parentheses with a short alias (lowercase, no spaces)
- Departments must be indented with spaces or tabs
- Faculties must be separated by blank lines
- No extra text or formatting

## Faculty Aliases Used in Database

The following aliases are used for collection names in Firestore:

| Faculty Name | Alias |
|--------------|-------|
| Faculty of Arts and Humanities | fah |
| Faculty of Science | fsc |
| Faculty of Business Administration | fba |
| Faculty of Social Sciences | fss |
| Faculty of Law | folaw |
| Faculty of Biological Sciences | fbio |
| Faculty of Engineering | fengg |
| Faculty of Education | fedu |
| Faculty of Marine Sciences and Fisheries | fmsf |

## Firestore Storage Structure

Data is stored in the `basic-info` document with the following structure:

```
student-information-form/
  └── basic-info (Document)
      ├── faculties (Object)
      │   ├── fah (Faculty)
      │   │   ├── name: "Faculty of Arts and Humanities"
      │   │   ├── alias: "fah"
      │   │   ├── createdAt: Timestamp
      │   │   └── departments: ["Bangla", "English", "History", ...]
      │   ├── fsc (Faculty)
      │   │   └── ...
      │   └── ...
      ├── updatedAt: Timestamp
      ├── totalFaculties: Number
      └── totalDepartments: Number
```

## Using the Data in the Form

Once saved, the student form automatically:
1. Fetches faculty data on page load
2. Displays faculties in the faculty dropdown
3. Updates departments based on selected faculty
4. Uses the full faculty name for display but stores the name in submissions

## Refreshing Data

If you make changes to the faculty data:
1. Make edits in the text area
2. Click "Save Faculty Data" again
3. The data will be updated in Firestore
4. Forms already open will need to be refreshed to see changes

Click "Refresh Data" button to reload the currently saved data from Firestore.

## Error Handling

**No data saved yet**: If you see "No faculty data found in database", ensure you've completed the setup process.

**Parse errors**: If the system can't parse your data, check:
- Faculty aliases are in parentheses: `(alias)`
- Departments are indented
- No extra formatting or special characters

**Firestore errors**: Ensure:
- Firebase credentials in `.env` are correct
- Firestore database is accessible
- You have write permissions to `student-information-form/basic-info`

## Tips

- You only need to do this setup once initially
- You can update the data anytime by pasting new information and clicking Save
- The system preserves the creation timestamp even on updates
- All changes are immediately available to new form submissions
- Existing submissions are not affected by changes to faculty data

## Troubleshooting

**Q: Data shows but form doesn't display faculties**
- A: Refresh the form page. Faculties are loaded when the form first opens.

**Q: Parse error but data looks correct**
- A: Check that faculties are separated by blank lines and aliases are in lowercase.

**Q: Submit button is disabled**
- A: Make sure text area has content. Button will enable automatically.

**Q: Changes don't appear in form**
- A: The form caches data on load. Hard refresh the page (Ctrl+Shift+R) or open form in new tab.

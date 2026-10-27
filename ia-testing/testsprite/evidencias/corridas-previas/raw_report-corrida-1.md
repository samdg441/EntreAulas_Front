
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** EntreAulas_Front
- **Date:** 2026-10-26
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Sign in as a student and reach the student dashboard
- **Test Code:** [TC001_Sign_in_as_a_student_and_reach_the_student_dashboard.py](./TC001_Sign_in_as_a_student_and_reach_the_student_dashboard.py)
- **Test Error:** TEST BLOCKED

The student login could not be verified — the only provided credentials are for an administrator, and no student credentials were supplied.

Observations:
- The EntreAulas login page is displayed with “Estudiante” selected.
- The provided credentials are identified as an administrator account, which is instructed to use “Administrador.”
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/fff1e14f-2e4d-4e73-8852-d6f67fec183f
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Sign in as a teacher and reach the teacher dashboard
- **Test Code:** [TC002_Sign_in_as_a_teacher_and_reach_the_teacher_dashboard.py](./TC002_Sign_in_as_a_teacher_and_reach_the_teacher_dashboard.py)
- **Test Error:** TEST BLOCKED

The teacher login could not be verified — only administrator credentials were provided, which cannot establish that a teacher can log in and reach the teacher dashboard.

Observations:
- The login page offers separate Docente and Administrador user types.
- The provided credentials are explicitly identified as an administrator account.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/36558ab9-7324-4f11-a33a-2af061c859fc
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Validate a reset link and update the password
- **Test Code:** [TC003_Validate_a_reset_link_and_update_the_password.py](./TC003_Validate_a_reset_link_and_update_the_password.py)
- **Test Error:** TEST BLOCKED

The password-reset form and password-update confirmation could not be reached because the provided reset link used a fake token. The administrator account password was not changed.

Observations:
- The page displayed “Enlace no válido.”
- The page displayed “Token inválido o ya utilizado.”
- The page offered “Solicitar un nuevo enlace” and “Volver al inicio de sesión.”
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/41f1d869-9237-451e-879b-4827fa91a1b6
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Request a password recovery link
- **Test Code:** [TC004_Request_a_password_recovery_link.py](./TC004_Request_a_password_recovery_link.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/d5827a78-d910-4605-a5f0-127740f51e08
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Reject incorrect login credentials
- **Test Code:** [TC005_Reject_incorrect_login_credentials.py](./TC005_Reject_incorrect_login_credentials.py)
- **Test Error:** TEST FAILURE

The login did not show the expected invalid-credentials message. The page opened the student dashboard instead.

Observations:
- The dashboard displayed “¡Buenos días, JULIANA!”
- No invalid-credentials message was visible
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/2ae6c918-f06e-42a4-8f0e-4b553bfcd0c3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Create a new user account successfully
- **Test Code:** [TC006_Create_a_new_user_account_successfully.py](./TC006_Create_a_new_user_account_successfully.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/e8e2102f-0b5a-49e2-8948-2ee8f527fe29
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Reject an invalid email format during login
- **Test Code:** [TC007_Reject_an_invalid_email_format_during_login.py](./TC007_Reject_an_invalid_email_format_during_login.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/6c6adb9c-8d54-4c5d-9e7b-ea23173d9211
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Reject an invalid email format on password recovery
- **Test Code:** [TC008_Reject_an_invalid_email_format_on_password_recovery.py](./TC008_Reject_an_invalid_email_format_on_password_recovery.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/a1b7c6b5-3eae-40bf-a367-17ed123bfb2c
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Update the email domain when choosing a user type
- **Test Code:** [TC009_Update_the_email_domain_when_choosing_a_user_type.py](./TC009_Update_the_email_domain_when_choosing_a_user_type.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/8243e194-9f00-4903-8257-22843f932b54
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Reveal and hide the password while logging in
- **Test Code:** [TC010_Reveal_and_hide_the_password_while_logging_in.py](./TC010_Reveal_and_hide_the_password_while_logging_in.py)
- **Test Error:** TEST FAILURE

The login page does not provide a password visibility control, so the entered password cannot be revealed and hidden. Sign-in was not submitted, so successful login could not be verified.

Observations:
- The password remained masked after the page finished loading.
- No reveal or hide control was visible beside the password field.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/6fb9b914-263f-40ee-bd3d-d26e2a3e13ab
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Reject a weak password in the add user form
- **Test Code:** [TC011_Reject_a_weak_password_in_the_add_user_form.py](./TC011_Reject_a_weak_password_in_the_add_user_form.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/86fd9915-9612-45f3-b412-a7e09ea330ce
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Reject mismatched passwords on the reset form
- **Test Code:** [TC012_Reject_mismatched_passwords_on_the_reset_form.py](./TC012_Reject_mismatched_passwords_on_the_reset_form.py)
- **Test Error:** TEST BLOCKED

The password-mismatch check could not be run because the reset page requires a valid recovery link. Without a valid token, no password form was available to submit.

Observations:
- The page showed “Enlace no válido.”
- It stated “El enlace de recuperación es inválido o está incompleto.”
- Only “Solicitar un nuevo enlace” and “Volver al inicio de sesión” were available.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/a18f38bf-ed1d-44f8-abfe-52882ce62729
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Reject a duplicate email in the add user form
- **Test Code:** [TC013_Reject_a_duplicate_email_in_the_add_user_form.py](./TC013_Reject_a_duplicate_email_in_the_add_user_form.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/7efa101c-240a-40e3-91e7-6a5b667adcb3
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Filter a newly created user in the users table
- **Test Code:** [TC014_Filter_a_newly_created_user_in_the_users_table.py](./TC014_Filter_a_newly_created_user_in_the_users_table.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/960befba-c5f6-48a4-b1ae-41719a9e67fc
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Restrict admin user management to administrators
- **Test Code:** [TC015_Restrict_admin_user_management_to_administrators.py](./TC015_Restrict_admin_user_management_to_administrators.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/69b84b61-87ab-40d2-b8f7-7056c446823e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Handle an incomplete reset link
- **Test Code:** [TC016_Handle_an_incomplete_reset_link.py](./TC016_Handle_an_incomplete_reset_link.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/483ceb30-4d65-4b67-819d-aa70091276fc
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **62.50** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---
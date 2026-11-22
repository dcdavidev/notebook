---
title: Enhancements and integration
description: Extending SAP standard code and exchanging data with other systems.
---

**ALE (Application Link Enabling)**: the technology for asynchronous data exchange between SAP systems, usually through IDocs. Lesson [125](../course/v2/0125-idoc-and-ale.en.md).

**BAdI (Business Add-In)**: an object-oriented extension point provided by SAP: you implement an interface to add logic to the standard without modifying it. Lesson [122](../course/v2/0122-badis.en.md).

**Batch input**: the technique that loads data by simulating manual input on a transaction's screens (`CALL TRANSACTION`, SM35). Lesson [130](../course/v2/0130-batch-input.en.md).

**Customer exit**: an older extension point provided by SAP (`EXIT_*` function modules, managed with CMOD and SMOD). Lesson [121](../course/v2/0121-user-exits-and-customer-exits.en.md).

**Enhancement**: an extension of SAP standard code without modifying it: implicit (at the start or end of blocks) or explicit (enhancement points and sections). Lessons [120](../course/v2/0120-extending-standard-sap.en.md), [123](../course/v2/0123-enhancement-points.en.md).

**Forms (Smart Forms, Adobe Forms)**: print layouts for documents such as invoices and orders, designed with Smart Forms or Adobe Forms. Lesson [129](../course/v2/0129-forms.en.md).

**HTTP client**: the classes that call external web services over HTTP, such as REST APIs. Lesson [126](../course/v2/0126-http-and-rest.en.md).

**IDoc (Intermediate Document)**: SAP's standard format for exchanging business documents between systems, used with ALE and EDI. Lesson [125](../course/v2/0125-idoc-and-ale.en.md).

**JSON**: the text format for exchanging data over the web; in ABAP you build and parse it with `/UI2/CL_JSON` or with transformations. Lesson [127](../course/v2/0127-json-and-xml.en.md).

**OData**: the REST protocol that SAP Fiori apps use to read and write data; in ABAP it is exposed with SAP Gateway or with RAP. Lessons [128](../course/v2/0128-odata-with-sap-gateway.en.md), [144](../course/v2/0144-rap-business-services.en.md).

**REST**: the architectural style of web services based on resources and HTTP methods (`GET`, `POST`, `PUT`, `DELETE`). Lesson [126](../course/v2/0126-http-and-rest.en.md).

**RFC (Remote Function Call)**: calling a function module on another system, synchronously or asynchronously, through a destination (SM59). Lesson [124](../course/v2/0124-rfc.en.md).

**SAP Gateway**: the component that exposes ABAP data and logic as OData services (transaction SEGW). Lesson [128](../course/v2/0128-odata-with-sap-gateway.en.md).

**User exit**: an old extension point: an empty subroutine in standard code (often `USEREXIT_*`) where the customer adds their own code. Lesson [121](../course/v2/0121-user-exits-and-customer-exits.en.md).

**XML**: the markup format for data exchange; in ABAP you read and build it with `CALL TRANSFORMATION` and the iXML library. Lesson [127](../course/v2/0127-json-and-xml.en.md).

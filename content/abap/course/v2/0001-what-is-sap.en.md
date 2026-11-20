---
title: What is SAP
description: The company, its ERP products, and why businesses run on them.
---

_Beginner level_

Before you write a line of ABAP, it helps to know what kind of system you're writing it for. ABAP programs run inside SAP systems, and SAP systems run the daily business of many of the world's largest companies: they sell, buy, pay, ship, and produce through them.

This lesson explains what SAP is, what an ERP system does, and which SAP products you'll meet on the job.

## The company

**SAP** is a German software company, founded in 1972 by five former IBM employees. The name stands for _Systemanalyse und Programmentwicklung_ ("system analysis and program development"); today it's simply the brand. SAP builds business software: programs that companies use to run their processes, not games or consumer apps.

When people say "we run on SAP", they usually mean a specific SAP product: the company's ERP system.

## What an ERP system is

**ERP** stands for _Enterprise Resource Planning_: one integrated system that manages all the core activities of a company. Purchasing, sales, warehouse, accounting, production, and human resources share **one database** and one set of master data (customers, suppliers, materials).

Integration is the key idea. When a salesperson posts a delivery, the system reduces the stock in the warehouse, creates an accounting document, and updates the customer's open items, all at once. Nobody types the same data twice, and every department sees the same numbers.

> [!TIP]
> Think of a restaurant. Someone orders ingredients, someone stores them, someone cooks, someone serves, and someone counts the money. If everyone keeps their own notebook, the numbers never match. An ERP is one big whiteboard that everyone reads and updates: when the waiter sells a dish, the pantry knows ingredients are missing and the cash book records the sale.

## Modules and business areas

SAP's ERP is organized into functional areas, traditionally called **modules**. You'll hear their abbreviations all the time:

| Abbreviation | Name                          | What it covers                               |
| ------------ | ----------------------------- | -------------------------------------------- |
| FI           | Financial Accounting          | general ledger, customer and vendor accounts |
| CO           | Controlling                   | cost centers, internal cost accounting       |
| SD           | Sales and Distribution        | sales orders, deliveries, billing            |
| MM           | Materials Management          | purchasing, inventory, materials             |
| PP           | Production Planning           | production orders, planning                  |
| PM           | Plant Maintenance             | maintenance of machines and plants           |
| QM           | Quality Management            | inspections and quality control              |
| EWM          | Extended Warehouse Management | detailed warehouse processes                 |
| HCM          | Human Capital Management      | employees, payroll                           |

**Functional consultants** configure these modules for each company (this setup is called **customizing**). **ABAP developers** write the code that the standard doesn't cover: custom reports, interfaces to other systems, forms, and extensions.

## SAP products you'll meet

SAP's ERP has gone through several generations. Old and new systems coexist, so you'll find all of them in real projects:

| Product           | Years      | Notes                                                                      |
| ----------------- | ---------- | -------------------------------------------------------------------------- |
| SAP R/2           | 1979–1990s | mainframe system, historical                                               |
| SAP R/3           | 1992–2000s | client-server architecture: the base of everything that followed           |
| SAP ERP (ECC 6.0) | 2006–today | the successor of R/3, runs on many databases; mainstream support ends 2027 |
| SAP S/4HANA       | 2015–today | the current ERP, runs only on the SAP HANA database                        |
| SAP S/4HANA Cloud | 2017–today | S/4HANA as a service, with stricter rules for custom code                  |

Around the ERP, SAP offers many other products, for example:

- **SAP HANA**: an in-memory database, the foundation of S/4HANA.
- **SAP Business Technology Platform (BTP)**: SAP's cloud platform, where you can also develop in ABAP (the ABAP environment, also called "Steampunk").
- **SAP Fiori**: the modern web user interface for SAP applications.
- **SAP BW/4HANA**, **SAP SuccessFactors**, **SAP Ariba**: analytics, HR in the cloud, and procurement.

Most of these products, and certainly every ECC and S/4HANA system, are built in ABAP. That's why ABAP developers are in demand: the language is introduced in [What is ABAP](./0002-what-is-abap.en.md).

> [!WARNING]
> Don't confuse the product with the version. "SAP" alone says little: an ECC 6.0 system and an S/4HANA 2023 system have different tables, different tools, and different rules for custom code. When you start on a project, the first thing to find out is which product and release you're working on.

## Exercise

> [!IMPORTANT]
>
> 1. If you have access to an SAP system, log on and open the menu **System > Status**. Find the product version in the component information (look for `S4CORE` for S/4HANA or `SAP_APPL` for ECC).
> 2. Pick a company you know (a supermarket, a car maker, an airline) and list three business processes that would use FI, SD, and MM.

### Solution

1. In **System > Status**, the button for component information lists the installed software components and their releases. If you see `S4CORE`, you're on S/4HANA; if you see `SAP_APPL` with release 600 or higher and no `S4CORE`, you're on ECC.
2. For an airline, for example: SD sells tickets and bills travel agencies; MM buys fuel and catering supplies; FI posts the revenue, pays suppliers, and closes the books.

> [!NOTE]
>
> - SAP is a German company that builds business software.
> - An ERP system manages all the core processes of a company in one integrated system with one database.
> - Modules such as FI, CO, SD, and MM cover the business areas; consultants customize them, developers extend them.
> - The main ERP products are ECC 6.0 (the previous generation) and S/4HANA (the current one, on SAP HANA).
> - Most SAP products are written in ABAP.

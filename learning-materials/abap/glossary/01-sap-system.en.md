---
title: The SAP system and the tools
description: Architecture, landscape, clients, SAP GUI, ADT, packages, and transports.
---

**ABAP**: the programming language of SAP systems: it runs on the application server and is used to build reports, interfaces, extensions, and services. Lesson [2](../course/v2/0002-what-is-abap.en.md).

**ABAP Development Tools (ADT)**: the Eclipse-based IDE for ABAP; it is the only tool for CDS, RAP, and ABAP Cloud. Lesson [6](../course/v2/0006-abap-development-tools.en.md).

**Application server**: the layer of the SAP system that runs ABAP programs, between SAP GUI and the database; it also has its own file system. Lessons [3](../course/v2/0003-sap-system-architecture.en.md), [74](../course/v2/0074-files-on-the-application-server.en.md).

**Client**: an independent unit within an SAP system, with its own data and users; it is the first field (`MANDT`) of almost every table. Lesson [4](../course/v2/0004-system-landscape-and-clients.en.md).

**Package**: the container that groups development objects and sets their transport and visibility. Lesson [7](../course/v2/0007-packages-and-transport-requests.en.md).

**SAP**: the German company that makes ERP business software, such as SAP ECC and SAP S/4HANA, that many companies run on. Lesson [1](../course/v2/0001-what-is-sap.en.md).

**SAP GUI**: the desktop program the user installs to log on to the SAP system and use transactions. Lesson [5](../course/v2/0005-sap-gui-and-transaction-codes.en.md).

**System landscape**: a company's set of SAP systems, usually development, quality, and production, connected by transports. Lesson [4](../course/v2/0004-system-landscape-and-clients.en.md).

**Transaction code**: a code (for example SE38 or VA01) that opens a program or a function of the SAP system directly. Lesson [5](../course/v2/0005-sap-gui-and-transaction-codes.en.md).

**Transport request**: the container that records changes to objects and carries them from the development system to quality and production. Lesson [7](../course/v2/0007-packages-and-transport-requests.en.md).

**Work process**: an application server process that runs user requests: dialog, background, update, enqueue, spool. Lesson [3](../course/v2/0003-sap-system-architecture.en.md).

---
title: abapGit and version control
description: Keep ABAP code in Git repositories.
level: pro
---

ABAP code lives in the database of the SAP system, not in files. The system keeps a version history of each object, and the [transport system](./0007-packages-and-transport-requests.md) moves objects from development to production. But there are no branches, no pull requests, and no easy way to share code outside the landscape. **abapGit** fills that gap: it's an open-source **Git client written in ABAP** that turns the objects of a package into files and pushes them to a Git repository on GitHub, GitLab, Bitbucket, or any other Git server, and back.

## How abapGit works

abapGit **serializes** each object into one or more text files: source code as `.abap` files, metadata as XML. A repository for a small flight app looks like this:

```text
zflight-app/
├── .abapgit.xml
├── README.md
└── src/
    ├── package.devc.xml
    ├── ztravel.tabl.xml
    ├── zr_travel.ddls.asddls
    ├── zr_travel.ddls.xml
    ├── zr_travel.bdef.asbdef
    ├── zcl_flight_service.clas.abap
    ├── zcl_flight_service.clas.testclasses.abap
    ├── zcl_flight_service.clas.xml
    ├── zflight_report.prog.abap
    └── zflight_report.prog.xml
```

The file name is the object name plus the object type (`clas`, `prog`, `tabl`, `ddls`, `bdef`, ...). When you **pull**, abapGit reads the files and creates or updates the objects in the system. The file `.abapgit.xml` holds the settings of the repository:

```xml
<?xml version="1.0" encoding="utf-8" ?>
<asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">
 <asx:values>
  <DATA>
   <MASTER_LANGUAGE>E</MASTER_LANGUAGE>
   <STARTING_FOLDER>/src/</STARTING_FOLDER>
   <FOLDER_LOGIC>PREFIX</FOLDER_LOGIC>
   <IGNORE>
    <item>/README.md</item>
   </IGNORE>
  </DATA>
 </asx:values>
</asx:abap>
```

- `MASTER_LANGUAGE` is the original language of the objects.
- `FOLDER_LOGIC` maps subpackages to folders: with `PREFIX`, a subpackage `ZFLIGHT_UI` of `ZFLIGHT` becomes the folder `src/ui/`; with `FULL`, the folder has the full package name.

## Install and connect

There are two ways to use abapGit:

| Where                                     | How                                                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| SAP GUI, on premise                       | create the report `ZABAPGIT_STANDALONE`, paste the single source file from the abapGit project, activate, and run it |
| ADT, SAP BTP ABAP environment and S/4HANA | install the abapGit plugin for Eclipse and use the **abapGit Repositories** view                                     |

To work with a remote server from SAP GUI, the system needs the SSL certificates of the Git server in `STRUST`, and often a proxy configuration. If that's not possible, use **offline repositories**: abapGit exports and imports the package as a ZIP file.

To connect a package:

1. In abapGit, choose **New Online**, enter the URL of an empty Git repository, and the package, for example `ZFLIGHT`.
2. abapGit compares the package with the repository and shows the differences.
3. Choose **Stage**, select the files to commit, enter a message and an author, and choose **Commit**. abapGit pushes the commit to the remote server.

From then on, the usual Git workflow applies: change objects in the system, stage, commit, and push; create branches, open pull requests, and review the code on the Git server.

> [!TIP]
> abapGit is like a scanner and a printer for your package. Pushing scans every object into documents you can store and send anywhere; pulling prints the documents back into a system, even into a system that has never seen them.

## Pull into another system

To install the code in another system, create an online repository there with the same URL and a package, and choose **Pull**. abapGit creates the objects in the right order, asks for a transport request if the package is transportable, and activates them. This is how open-source ABAP projects are installed, and how you can move code between systems that aren't in the same transport landscape, for example from an on-premise system to the SAP BTP ABAP environment.

> [!CAUTION]
> A pull overwrites the objects in the system with the version in the repository. Changes that you made in the system and didn't push are lost. Before pulling, look at the differences that abapGit shows, and push or save your own changes first.

## abapGit, transports, and gCTS

abapGit doesn't replace the transport system on premise: changes still reach quality and production with transport requests. Use abapGit for what transports can't do: share code and reuse libraries, keep a history outside the system, review code with pull requests, run checks such as `abaplint` in a CI pipeline on every push, and move code between unconnected systems.

SAP also offers **gCTS** (Git-enabled Change and Transport System), which ties transports to a Git repository, and in the SAP BTP ABAP environment the app **Manage Software Components** uses Git under the hood to move software components between systems.

> [!WARNING]
> abapGit serializes only active objects. Activate everything before you stage, or the repository gets an old version or no file at all for the inactive objects.

## Exercise

> [!IMPORTANT]
>
> 1. Install `ZABAPGIT_STANDALONE` (or the ADT plugin) and create an empty repository on GitHub.
> 2. Link your package `ZFLIGHT` to the repository and push all its objects.
> 3. Change a comment in one class directly on GitHub, then pull it into the system and check the change in the class.

### Solution

After step 2, the repository contains a `src` folder with one or more files per object and the file `.abapgit.xml`. After step 3, abapGit shows the class as changed on the remote side; **Pull** updates it in the system, and the version history of the class (in ADT or `SE24`) shows a new version.

> [!NOTE]
>
> - abapGit is an open-source Git client written in ABAP: it serializes the objects of a package into files and back.
> - Each object becomes files named after the object and its type, such as `zcl_flight_service.clas.abap`; `.abapgit.xml` holds the settings.
> - Use the standalone report in SAP GUI, or the ADT plugin; offline repositories work with ZIP files.
> - A pull overwrites objects in the system: check the differences first.
> - abapGit complements transports on premise; gCTS and Manage Software Components bring Git into the transport process itself.

#%global debug_package %{nil}

Name: spectrum.js
Version: %{version}
Release: 1
Group: Development/Languages/Other
Distribution: BBC
Packager: BBC OTG Frameworks Team
Vendor: BBC Future Media & Technology, Online Technology Group
License: Copyright 2010 British Broadcasting Corporation
Summary: Spectrum.js
URL: https://github.com/bbc-frameworks/spectrum.js
Conflicts: none
BuildRoot: %{_topdir}/BUILD
BuildArch: noarch

%description
Spectrum.js - JavaScript template system

%install

echo /usr > ../filelist

%files -f ../filelist

%defattr(-,root,root)



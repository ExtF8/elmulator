# Modules Overview

This document provides an overview and usage guide for modules: "Rings Resistance Calculations," "External Impedance Calculations," "Module for calculating circuit count" and "Rename TI"

## 1. Rings Resistance Calculations

### Overview

The "Rings Resistance Calculations" module calculates resistance values based on a given input. It employs predefined multipliers to determine the resistance for different scenarios, producing output values rounded to the desired precision.

### Usage Guide

1. **Input Resistance Value**: Provide the resistance value (referred to as `r1`).
2. **Review Calculated Outputs**: The module will automatically generate the following outputs:
   - **R2 Multiplier 1**: The calculated resistance using the first multiplier.
   - **R2 Multiplier 2**: The calculated resistance using the second multiplier.
   - **R Sum 1**: The summation of `r1` and the result from R2 Multiplier 1, divided by a specific factor.
   - **R Sum 2**: The summation of `r1` and the result from R2 Multiplier 2, divided by the same factor.

3. **Outputs**: The results are displayed in real-time as you modify the input resistance value.

---

## 2. External Impedance Calculations

### Overview

The "External Impedance Calculations" module focuses on determining the impedance in kilo amperes based on provided voltage and impedance values. If only one value is provided, the module assumes default values for missing inputs to produce results.

### Usage Guide

1. **Provide Inputs**:
   - **Voltage**: Enter the voltage value. If not provided, a default value will be assumed.
   - **Zdb (Impedance Value)**: Provide the impedance value.
2. **Review the Calculated Outputs**: The module will automatically compute the following:
   - **One Phase**: Impedance in amperes for a single phase.
   - **Three Phase**: Impedance in amperes for three phases.
   - **Single Phase IPF**: Impedance in kilo amperes for a single phase.
   - **Three Phase IPF**: Impedance in kilo amperes for three phases.
3. **Understanding the Conversions**: The module will convert impedance values to kilo amperes, displaying results with high precision or low precision based on the impedance input.

---

## 3. Module for calculating circuit count

### Overview

The module is designed to help distribute circuit work among engineers. You input the number of engineers and the number of circuits (either single phase or three phase). The module then calculates how the circuits should be distributed among the engineers.

### Usage Guide

1. **Provide Inputs**:
   - **Number of Engineers**: Enter the number of engineers available for the circuit distribution.
   - **Number of Single-Phase Circuits (SP)**: Provide the number of single-phase circuits that need to be distributed.
   - **Number of Three-Phase Circuits (TP)**: Provide the number of three-phase circuits that need to be distributed.
2. **Review the Calculated Outputs**:
   - **One Engineer (Single Phase)**: This section shows the number of single-phase circuits that one particular engineer will handle, including any excess if the total circuits are not evenly divisible by the number of engineers.
   - **Other Engineers (Single Phase)**: This section shows the number of single-phase circuits that the remaining engineers will handle.
   - **One Engineer (Three Phase)**: This section shows the number of three-phase circuits that one particular engineer will handle, including any excess.
   - **Other Engineers (Three Phase)**: This section shows the number of three-phase circuits that the remaining engineers will handle.
3. **Understanding the Distribution**: The module divides the circuits equally among the engineers, with one engineer handling any excess circuits if they cannot be evenly divided.

---

## 4. Rename TI

### Overview

The "Rename TI" module automates the process of renaming thermal image files (e.g., `FLIR4179.jpg`) based on naming references extracted from a provided PDF. The PDF includes text lines like `DB-A/SH TI-4179`, where the part before `TI-` becomes the new name (`DB-A-SH.jpg`) and the digits after `TI-` are used to match the corresponding image file.

This module helps ensure consistency and accuracy in naming large sets of images.

### Usage Guide

1. **Select Inputs**:
   - **PDF File**: Choose the PDF that contains the references (`<NAME> TI-<REF>` lines).
   - **Photos Folder**: Choose the directory containing the thermal image files to rename.
2. **Choose Mode**:
   - **Copy**: Creates renamed copies in a new output folder.
   - **In Place**: Renames the original files directly.
3. **Dry Run**:
   - Press **Rename** to perform a dry run.
   - The output window will show the planned renames, e.g.:

     ```
     Planned outputs:
     - FLIR4179.jpg → DB-A-SH.jpg
     - FLIR4180.jpg → DB-Balls.jpg

     Dry run. Press Apply to write files to disk.
     ```

4. **Apply Changes**:
   - Press **Apply** to execute the renaming.
   - The output window will confirm completion, e.g.:

     ```
     Done.
     Wrote 4 files to:
     /path/to/photos/renamed_output
     ```

---

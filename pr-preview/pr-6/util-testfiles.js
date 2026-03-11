export const docWithBayAndFunctions = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL"
  xmlns:eosld="https://openscd.org/SCL/SSD/SLD/v0"
  xmlns:eTr_6-100="http://www.iec.ch/61850/2019/SCL/6-100" version="2007" revision="B">
  <Substation name="S1">
    <Private type="OpenSCD-SLD-Layout">
      <eosld:SLDAttributes eosld:w="50" eosld:h="25" />
    </Private>
    <VoltageLevel name="V1">
      <Bay name="B1">
        <Private type="OpenSCD-SLD-Layout">
          <eosld:SLDAttributes eosld:x="5" eosld:y="5" eosld:w="20" eosld:h="15" />
        </Private>
        <ConductingEquipment type="CAB" name="CAB1">
					<Private xmlns="" type="OpenSCD-SLD-Layout">
						<eosld:SLDAttributes eosld:x="5" eosld:y="5" eosld:lx="6" eosld:ly="6"/>
					</Private>
					<Terminal name="T2" connectivityNode="S1/V1/BB1/L" substationName="S1" voltageLevelName="V1" bayName="BB1" cNodeName="L">
						<Private xmlns="" type="OpenSCD-SLD-Layout">
							<eosld:SLDAttributes eosld:uuid="21578381-cfea-446c-aebe-532f1ac13192"/>
						</Private>
					</Terminal>
				</ConductingEquipment>
        <Function name="F1">
          <Private type="OpenSCD-SLD-Layout">
            <eosld:SLDAttributes eosld:x="10" eosld:y="10" />
          </Private>
        </Function>
        <Function name="F2">
          <Private type="OpenSCD-SLD-Layout">
            <eosld:SLDAttributes eosld:x="15" eosld:y="12" />
          </Private>
        </Function>
        <Function name="CABFunction">
          <Private type="OpenSCD-SLD-Layout">
            <eosld:SLDAttributes eosld:x="8" eosld:y="13"/>
          </Private>
          <Private type="eIEC61850-6-100">
            <eTr_6-100:PowerSystemRelations>
              <eTr_6-100:PowerSystemRelation relation="S1/V1/B1/CAB1"/>
            </eTr_6-100:PowerSystemRelations>
          </Private>
        </Function>
      </Bay>
      <Function name="F3">
        <Private type="OpenSCD-SLD-Layout">
          <eosld:SLDAttributes eosld:x="25" eosld:y="10" />
        </Private>
      </Function>
    </VoltageLevel>
  </Substation>
</SCL>`;
//# sourceMappingURL=util-testfiles.js.map
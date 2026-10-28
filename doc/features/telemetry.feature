Feature: Heartbeat och latensmätning

  Scenario: Systemet skickar regelbundna hjärtslag och mäter latens
    Given att systemet är aktivt
    When ett hjärtslag skickas
    Then ska latensen mätas och loggas

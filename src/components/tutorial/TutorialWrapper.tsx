"use client"

import { useEffect, useState } from "react"
import { checkTutorialNeeded, completeTutorial } from "@/actions/tutorial"
import { TutorialOverlay } from "./TutorialOverlay"

type TutorialWrapperProps = {
  role: "siswa" | "pembimbing"
}

export function TutorialWrapper({ role }: TutorialWrapperProps) {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkTutorialNeeded()
      .then((needed) => {
        if (role === "siswa" || role === "pembimbing") {
          setShow(needed)
        }
      })
      .finally(() => setLoading(false))
  }, [role])

  const handleComplete = () => {
    setShow(false)
    completeTutorial()
  }

  if (loading || !show) return null

  return <TutorialOverlay role={role} onComplete={handleComplete} />
}

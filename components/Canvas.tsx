import getInitialClient from "@/helpers/getClient";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { MdArrowBack } from "react-icons/md";
import { useQuery, useQueryClient } from "react-query";
import UpperToolBar from "./UpperToolBar";
import { shapes } from "@/types/shapes";
import { draw, startDrawing, stopDrawing } from "@/helpers/canvasFunctions";
import { clearCanvas, downlaodPNG, setImage, undo } from "@/helpers/canvasUtilites";
import { elements } from "@/types/elements";
import { Models } from "appwrite";

type props = {
    color: string
    projectData: Models.Document | undefined
    data: any
}

const Canvas = ({ color , projectData, data}: props) => {
    const router = useRouter()
    const { id } = router.query
    const { client, account, databases } = getInitialClient()
    const queryClient = useQueryClient()
    // const projectData: any = queryClient.getQueryData("project")
    const patternRef = useRef<HTMLImageElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [currentState, setCurrentState] = useState<string | null>(null)
    const cursorRef = useRef<HTMLDivElement>(null)
    const [isDrawing, setIsDrawing] = useState<boolean>(false)
    const [lastX, setLastX] = useState<number>(0)
    const [lastY, setLastY] = useState<number>(0)
    const [currentX, setCurrentX] = useState<number>(0)
    const [currentY, setCurrentY] = useState<number>(0)
    const [elemArr, setElemArr] = useState<elements[]>([])
    const [cursor, setCursor] = useState<boolean>(false)
    const [stack, setStack] = useState<string[]>([])
    const [top, setTop] = useState<number>(-1)
    const [shape, setShape] = useState<shapes>("free")


    const setProject = async (imgData: string) => {
        const userData: any = queryClient.getQueryData("userData")
        databases.updateDocument("6475e4e81155c46f87b6", "6475f82bb6f201570328", id as string, {
            data: imgData.toString(),
            edited_by: data?.email
        }).then(d => console.log("updated")).catch(err => console.log(err))
    }


    useEffect(() => {
        setCurrentState(null)
        const unsubscribe = client.subscribe([`databases.6475e4e81155c46f87b6.collections.6475f82bb6f201570328.documents.${id}`, 'files'], (response: any) => {
            if (response.payload.edited_by !== data?.email) {
                setImage(response.payload.data, canvasRef)
            }
        });
        return () => unsubscribe()
    }, [])


    useEffect(() => {
        const canvas: HTMLCanvasElement | null = canvasRef.current
        if (canvas) {
            canvas.height = window.innerHeight
            canvas.width = window.innerWidth
            const context: CanvasRenderingContext2D | null = canvas.getContext("2d")
            if (context) {
                context.clearRect(0, 0, canvas.width, canvas.height)

                if (projectData?.data && projectData?.data !== "null") {
                    setImage(projectData.data, canvasRef)
                    setStack((stack) => [data])
                }
                else {
                    const data = canvas.toDataURL()
                    setStack((stack) => [...stack, data])
                }
                setTop(0)
            }
        }
    }, [])

    return (
        <>
            <UpperToolBar undo={() => undo(canvasRef, top, setCurrentState, stack, setStack, setTop, setProject)} download={() => downlaodPNG(canvasRef)} clear={() => clearCanvas(canvasRef, setStack, stack, setTop)} shape={shape} setShape={setShape} />
            {/* <div style={{ top: lastY, left: lastX, width: currentX - lastX, height: currentY - lastY }} className={`absolute border-2 border-white/30  h-5 w-5 ${cursor && shape==="circle"?"block":"hidden"} top-10`}></div> */}
            <div style={{ top: lastY, left: lastX, width: (currentX - lastX), height: (currentY - lastY) }} className={`absolute border-2 border-white/30  h-5 w-5 ${cursor && shape === "square" ? "block" : "hidden"} top-10`}></div>
            <div style={{ top: lastY, left: lastX, width: (currentX - lastX), height: "5px" }} className={`absolute border-2 border-white/30 ${shape === "circle" ? "rounded-full" : ""} h-5 w-5 ${cursor && shape === "circle" ? "block" : "hidden"} top-10`}></div>
            <Link href="/dashboard" className={`absolute left-3 rounded-md bg-green-400/70 top-3 text-white p-2`}>
                <MdArrowBack />
            </Link>


            <canvas
                onTouchStart={(e) => startDrawing(e, setIsDrawing, setCursor, setLastX, setLastY, setCurrentX, setCurrentY)}
                onTouchMove={(e) => draw(e, isDrawing, canvasRef, color, shape, setCurrentX, setCurrentY, currentX, currentY, setElemArr, lastX, lastY, setLastX, setLastY)}
                onTouchEnd={(e) => stopDrawing(e, canvasRef, setCursor, setIsDrawing, elemArr, color, shape, setElemArr, stack, setStack, setTop, setCurrentState, setProject)}
                onMouseDown={(e) => startDrawing(e, setIsDrawing, setCursor, setLastX, setLastY, setCurrentX, setCurrentY)}
                onMouseMove={(e) => draw(e, isDrawing, canvasRef, color, shape, setCurrentX, setCurrentY, currentX, currentY, setElemArr, lastX, lastY, setLastX, setLastY)}
                onMouseUp={(e) => stopDrawing(e, canvasRef, setCursor, setIsDrawing, elemArr, color, shape, setElemArr, stack, setStack, setTop, setCurrentState, setProject)}
                ref={canvasRef}
            />

        </>
    );
};

export default Canvas;
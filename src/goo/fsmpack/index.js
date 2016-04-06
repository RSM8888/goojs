module.exports = {
	MachineHandler: require('./MachineHandler'),
	ProximityComponent: require('./proximity/ProximityComponent'),
	ProximitySystem: require('./proximity/ProximitySystem'),
	Action: require('./statemachine/actions/Action'),
	Actions: require('./statemachine/actions/Actions'),
	AddLightAction: require('./statemachine/actions/AddLightAction'),
	AddPositionAction: require('./statemachine/actions/AddPositionAction'),
	AddVariableAction: require('./statemachine/actions/AddVariableAction'),
	ApplyImpulseAction: require('./statemachine/actions/ApplyImpulseAction'),
	ArrowsAction: require('./statemachine/actions/ArrowsAction'),
	CollidesAction: require('./statemachine/actions/CollidesAction'),
	CompareCounterAction: require('./statemachine/actions/CompareCounterAction'),
	CompareCountersAction: require('./statemachine/actions/CompareCountersAction'),
	CompareDistanceAction: require('./statemachine/actions/CompareDistanceAction'),
	CopyJointTransformAction: require('./statemachine/actions/CopyJointTransformAction'),
	DollyZoomAction: require('./statemachine/actions/DollyZoomAction'),
	EmitAction: require('./statemachine/actions/EmitAction'),
	EvalAction: require('./statemachine/actions/EvalAction'),
	FireAction: require('./statemachine/actions/FireAction'),
	GetPositionAction: require('./statemachine/actions/GetPositionAction'),
	HideAction: require('./statemachine/actions/HideAction'),
	HtmlAction: require('./statemachine/actions/HtmlAction'),
	InBoxAction: require('./statemachine/actions/InBoxAction'),
	IncrementCounterAction: require('./statemachine/actions/IncrementCounterAction'),
	InFrustumAction: require('./statemachine/actions/InFrustumAction'),
	KeyDownAction: require('./statemachine/actions/KeyDownAction'),
	KeyPressedAction: require('./statemachine/actions/KeyPressedAction'),
	KeyUpAction: require('./statemachine/actions/KeyUpAction'),
	LogMessageAction: require('./statemachine/actions/LogMessageAction'),
	LookAtAction: require('./statemachine/actions/LookAtAction'),
	MouseDownAction: require('./statemachine/actions/MouseDownAction'),
	MouseMoveAction: require('./statemachine/actions/MouseMoveAction'),
	MouseUpAction: require('./statemachine/actions/MouseUpAction'),
	MoveAction: require('./statemachine/actions/MoveAction'),
	MultiplyVariableAction: require('./statemachine/actions/MultiplyVariableAction'),
	NumberCompareAction: require('./statemachine/actions/NumberCompareAction'),
	PauseAnimationAction: require('./statemachine/actions/PauseAnimationAction'),
	PickAction: require('./statemachine/actions/PickAction'),
	PickAndExitAction: require('./statemachine/actions/PickAndExitAction'),
	RandomTransitionAction: require('./statemachine/actions/RandomTransitionAction'),
	RemoveAction: require('./statemachine/actions/RemoveAction'),
	RemoveLightAction: require('./statemachine/actions/RemoveLightAction'),
	RemoveParticlesAction: require('./statemachine/actions/RemoveParticlesAction'),
	ResumeAnimationAction: require('./statemachine/actions/ResumeAnimationAction'),
	RotateAction: require('./statemachine/actions/RotateAction'),
	ScaleAction: require('./statemachine/actions/ScaleAction'),
	SetAnimationAction: require('./statemachine/actions/SetAnimationAction'),
	SetClearColorAction: require('./statemachine/actions/SetClearColorAction'),
	SetCounterAction: require('./statemachine/actions/SetCounterAction'),
	SetLightRangeAction: require('./statemachine/actions/SetLightRangeAction'),
	SetPositionAction: require('./statemachine/actions/SetPositionAction'),
	SetRenderTargetAction: require('./statemachine/actions/SetRenderTargetAction'),
	SetRotationAction: require('./statemachine/actions/SetRotationAction'),
	SetVariableAction: require('./statemachine/actions/SetVariableAction'),
	ShakeAction: require('./statemachine/actions/ShakeAction'),
	ShowAction: require('./statemachine/actions/ShowAction'),
	SmokeAction: require('./statemachine/actions/SmokeAction'),
	SoundFadeInAction: require('./statemachine/actions/SoundFadeInAction'),
	SoundFadeOutAction: require('./statemachine/actions/SoundFadeOutAction'),
	SwitchCameraAction: require('./statemachine/actions/SwitchCameraAction'),
	TagAction: require('./statemachine/actions/TagAction'),
	TransitionAction: require('./statemachine/actions/TransitionAction'),
	TransitionOnMessageAction: require('./statemachine/actions/TransitionOnMessageAction'),
	TriggerEnterAction: require('./statemachine/actions/TriggerEnterAction'),
	TriggerLeaveAction: require('./statemachine/actions/TriggerLeaveAction'),
	TweenLightColorAction: require('./statemachine/actions/TweenLightColorAction'),
	TweenLookAtAction: require('./statemachine/actions/TweenLookAtAction'),
	TweenMoveAction: require('./statemachine/actions/TweenMoveAction'),
	TweenOpacityAction: require('./statemachine/actions/TweenOpacityAction'),
	TweenRotationAction: require('./statemachine/actions/TweenRotationAction'),
	TweenScaleAction: require('./statemachine/actions/TweenScaleAction'),
	TweenTextureOffsetAction: require('./statemachine/actions/TweenTextureOffsetAction'),
	WaitAction: require('./statemachine/actions/WaitAction'),
	WasdAction: require('./statemachine/actions/WasdAction'),
	FSMUtil: require('./statemachine/FSMUtil'),
	FsmUtils: require('./statemachine/FsmUtils'),
	Machine: require('./statemachine/Machine'),
	State: require('./statemachine/State'),
	StateMachineComponent: require('./statemachine/StateMachineComponent'),
	StateMachineSystem: require('./statemachine/StateMachineSystem'),
	StateMachineComponentHandler: require('./StateMachineComponentHandler'),
	StateMachineHandlers: require('./StateMachineHandlers')
};
if (typeof(window) !== 'undefined') {
	for (var key in module.exports) {
		window.goo[key] = module.exports[key];
	}
}
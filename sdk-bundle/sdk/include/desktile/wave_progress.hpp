#pragma once
#include <algorithm>
#include <cmath>
namespace desktile::sdk {
inline double waveProgressPosition(int x,int height,int level,int amplitude,int wavelength,unsigned phase){
    level=std::max(0,std::min(height,level));if(!level)return height;if(level==height)return 0;
    const double margin=std::min(level,height-level),t=std::min(1.0,margin/24.0);
    const double gain=t*t*(3.0-2.0*t);
    const double angle=6.283185307179586*(double(x)/wavelength+double(phase)/65536.0);
    return std::max(0.0,std::min(double(height),height-level+amplitude*gain*std::sin(angle)));
}
inline int waveProgressEdge(int x,int height,int level,int amplitude,int wavelength,unsigned phase){
    return int(std::ceil(waveProgressPosition(x,height,level,amplitude,wavelength,phase)));
}
}
